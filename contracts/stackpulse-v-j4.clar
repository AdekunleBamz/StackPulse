;; SPDX-License-Identifier: MIT
;; StackPulse V-J4 - Enhanced User Registry & Subscriptions
;; Upgrades from V2:
;; - Better error handling with more descriptive error codes
;; - Optimized gas usage with efficient data structures
;; - Enhanced event logging for chainhooks
;; - Added batch operations support
;; - Improved subscription management
;; 
;; Flow:
;; 1. User calls (register-and-subscribe) with profile + tier (0=free, 1-3=paid)
;; 2. For free tier: no STX transfer, just stores profile
;; 3. For paid tiers: transfers STX, stores profile + subscription
;; 4. User can update profile anytime with (update-profile)
;; 5. User can upgrade tier with (upgrade-subscription)

;; ============================================
;; ERROR CODES
;; ============================================
;; @desc Error returned when a user is already registered in the system
(define-constant ERR-ALREADY-REGISTERED (err u101))
;; @desc Error returned when a user attempt to operate on a non-existent profile
(define-constant ERR-NOT-REGISTERED (err u102))
;; @desc Error returned when an invalid subscription tier is specified
(define-constant ERR-INVALID-TIER (err u103))
;; @desc Error returned when a microSTX transfer operation fails
(define-constant ERR-TRANSFER-FAILED (err u104))
;; @desc Error returned when a caller lacks the required administrative or user permissions
(define-constant ERR-NOT-AUTHORIZED (err u105))
;; @desc Error returned when a username does not meet length requirements
(define-constant ERR-INVALID-USERNAME (err u106))
;; @desc Error returned when an invalid alert configuration bitmask is provided
(define-constant ERR-INVALID-ALERTS (err u107))
;; @desc Error returned when a subscription-required action is performed after expiration
(define-constant ERR-SUBSCRIPTION-EXPIRED (err u108))
;; @desc Error returned when an upgrade is attempted to the same tier
(define-constant ERR-SAME-TIER (err u109))
;; @desc Error returned when an invalid chainhook type is specified
(define-constant ERR-INVALID-HOOK-TYPE (err u110))
;; @desc Error returned when an invalid principal is provided (e.g. principal-0)
(define-constant ERR-INVALID-PRINCIPAL (err u111))

;; @desc Error returned when the contract is currently paused by admin
(define-constant ERR-CONTRACT-PAUSED (err u120))

;; Chainhook types
(define-constant HOOK-WHALE-TRANSFER u1)
(define-constant HOOK-CONTRACT-DEPLOY u2)
(define-constant HOOK-NFT-MINT u3)
(define-constant HOOK-TOKEN-LAUNCH u4)
(define-constant HOOK-LARGE-SWAP u5)
(define-constant HOOK-SUBSCRIPTION-CREATED u6)
(define-constant HOOK-ALERT-TRIGGERED u7)
(define-constant HOOK-FEE-COLLECTED u8)
(define-constant HOOK-BADGE-EARNED u9)

;; Subscription duration: ~30 days in blocks (assuming 10 min blocks)
(define-constant BLOCKS-PER-MONTH u4320)

;; Tier prices in microSTX
(define-constant PRICE-FREE u0)
(define-constant PRICE-BASIC u10000)        ;; 0.01 STX
(define-constant PRICE-PRO u50000)          ;; 0.05 STX  
(define-constant PRICE-PREMIUM u200000)     ;; 0.20 STX

;; Maximum valid tier
(define-constant MAX-TIER u3)

;; User profile constraints
(define-constant MIN-USERNAME-LEN u1)
(define-constant MAX-USERNAME-LEN u32)
(define-constant MAX-EMAIL-LEN u64)

;; Alert bitmasks
(define-constant ALERT-WHALE u1)
(define-constant ALERT-NFT u2)
(define-constant ALERT-TOKEN u4)
(define-constant ALERT-SWAP u8)
(define-constant ALERT-CONTRACT u16)
(define-constant ALL-ALERTS-MASK u31)

;; Maximum alerts bitmask (deprecated in favor of ALL-ALERTS-MASK)
(define-constant MAX-ALERTS-BITMASK ALL-ALERTS-MASK)

;; ============================================
;; DATA STORAGE
;; ============================================

(define-data-var total-users uint u0)
(define-data-var total-revenue uint u0)
(define-data-var contract-version (string-ascii 8) "v3.0.0")

;; Main user profile map
(define-map users principal
  {
    user-id: uint,
    username: (string-ascii 32),
    email: (string-ascii 64),
    tier: uint,
    subscription-ends: uint,
    alerts-enabled: uint,    ;; Bitmask: 1=whale, 2=nft, 4=token, 8=swap, 16=contract
    created-at: uint,
    updated-at: uint,
    total-triggers: uint     ;; V3: Track total chainhook triggers for user
  }
)

;; ============================================
;; READ-ONLY FUNCTIONS
;; ============================================

;; @description Returns the current version of the contract.
(define-read-only (get-version)
  (var-get contract-version)
)

;; @description Returns the profile data for a specific user.
;; @param who The principal of the user to query.
(define-read-only (get-user (who principal))
  (map-get? users who)
)

;; @description Checks if a principal is registered in the StackPulse system.
;; @param who The principal to check.
(define-read-only (is-registered (who principal))
  (is-some (map-get? users who))
)

;; @description Returns the subscription status and basic stats for a user.
;; @param who The principal to query.
(define-read-only (get-subscription-status (who principal))
  (match (map-get? users who)
    user-data 
      {
        registered: true,
        tier: (get tier user-data),
        active: (or (is-eq (get tier user-data) u0) 
                    (> (get subscription-ends user-data) block-height)),
        ends-at: (get subscription-ends user-data),
        total-triggers: (get total-triggers user-data)
      }
    { registered: false, tier: u0, active: false, ends-at: u0, total-triggers: u0 }
  )
)

;; @description Returns the required microSTX payment for a given tier.
;; @param tier The tier number (0-3).
(define-read-only (get-tier-price (tier uint))
  (if (is-eq tier u0) PRICE-FREE
    (if (is-eq tier u1) PRICE-BASIC
      (if (is-eq tier u2) PRICE-PRO
        (if (is-eq tier u3) PRICE-PREMIUM
          u0))))
)

;; @description Returns global registry statistics.
(define-read-only (get-stats)
  {
    total-users: (var-get total-users),
    total-revenue: (var-get total-revenue),
    version: (var-get contract-version)
  }
)

;; V3: Check if subscription is active
;; @description Checks if a user has an active paid subscription or is on the free tier.
;; @param who The principal to check.
(define-read-only (is-subscription-active (who principal))
  (match (map-get? users who)
    user-data
      (or (is-eq (get tier user-data) u0)
          (> (get subscription-ends user-data) block-height))
    false
  )
)

;; ============================================
;; PRIVATE HELPER FUNCTIONS
;; ============================================

;; V3: Validate username (non-empty, proper length)
(define-private (is-valid-username (username (string-ascii 32)))
  (let ((username-len (len username)))
    (and (>= username-len MIN-USERNAME-LEN) (<= username-len MAX-USERNAME-LEN))
  )
)

;; V3: Validate tier
(define-private (is-valid-tier (tier uint))
  (<= tier MAX-TIER)
)

;; ============================================
;; PUBLIC FUNCTIONS
;; ============================================

;; Register and subscribe in one transaction
;; tier: 0=Free, 1=Basic, 2=Pro, 3=Premium
;; alerts: bitmask (1=whale, 2=nft, 4=token, 8=swap, 16=contract) or just pass 31 for all
;; @description Registers a new user and starts a subscription in a single transaction.
;; @param username The desired username (1-32 chars).
;; @param email The user's contact email.
;; @param tier The subscription tier (0=Free, 1=Basic, 2=Pro, 3=Premium).
;; @param alerts Bitmask of enabled alerts (1=Whale, 2=NFT, 4=Token, 8=Swap, 16=Contract).
(define-public (register-and-subscribe 
    (username (string-ascii 32))
    (email (string-ascii 64))
    (tier uint)
    (alerts uint))
  (let
    (
      (caller tx-sender)
      (price (get-tier-price tier))
      (user-id (+ (var-get total-users) u1))
      (sub-ends (if (is-eq tier u0) 
                    u0 
                    (+ block-height BLOCKS-PER-MONTH)))
    )
    ;; V3: Enhanced validation
    (asserts! (is-valid-username username) ERR-INVALID-USERNAME)
    (asserts! (is-none (map-get? users caller)) ERR-ALREADY-REGISTERED)
    (asserts! (is-valid-tier tier) ERR-INVALID-TIER)
    (asserts! (<= alerts MAX-ALERTS-BITMASK) ERR-INVALID-ALERTS)
    
    ;; Transfer STX for paid tiers
    (if (> price u0)
      (try! (stx-transfer? price caller CONTRACT-OWNER))
      true
    )
    
    ;; Store user profile with V3 enhanced data
    (map-set users caller {
      user-id: user-id,
      username: username,
      email: email,
      tier: tier,
      subscription-ends: sub-ends,
      alerts-enabled: alerts,
      created-at: block-height,
      updated-at: block-height,
      total-triggers: u0
    })
    
    ;; Update stats
    (var-set total-users user-id)
    (if (> price u0)
      (var-set total-revenue (+ (var-get total-revenue) price))
      true
    )
    
    ;; V3: Enhanced event with more data for chainhooks
    (print {
      event: "user-registered",
      version: "v3",
      user: caller,
      user-id: user-id,
      username: username,
      tier: tier,
      price: price,
      alerts: alerts,
      subscription-ends: sub-ends,
      block: block-height
    })
    
    (ok user-id)
  )
)

;; Update profile (username, email, alerts) - no payment
;; @description Updates the user's profile information and alert preferences.
;; @param username New username.
;; @param email New email.
;; @param alerts New alert bitmask.
(define-public (update-profile 
    (username (string-ascii 32))
    (email (string-ascii 64))
    (alerts uint))
  (let
    (
      (caller tx-sender)
      (user-data (unwrap! (map-get? users caller) ERR-NOT-REGISTERED))
    )
    ;; V3: Validate inputs
    (asserts! (is-valid-username username) ERR-INVALID-USERNAME)
    (asserts! (<= alerts MAX-ALERTS-BITMASK) ERR-INVALID-ALERTS)
    
    (map-set users caller (merge user-data {
      username: username,
      email: email,
      alerts-enabled: alerts,
      updated-at: block-height
    }))
    
    (print {
      event: "profile-updated",
      version: "v3",
      user: caller,
      username: username,
      alerts: alerts,
      block: block-height
    })
    
    (ok true)
  )
)

;; Upgrade or renew subscription
;; @description Upgrades or renews an existing user subscription.
;; @param new-tier The target subscription tier.
(define-public (upgrade-subscription (new-tier uint))
  (let
    (
      (caller tx-sender)
      (user-data (unwrap! (map-get? users caller) ERR-NOT-REGISTERED))
      (current-tier (get tier user-data))
      (current-ends (get subscription-ends user-data))
      (price (get-tier-price new-tier))
      (new-ends (if (> current-ends block-height)
                    (+ current-ends BLOCKS-PER-MONTH)
                    (+ block-height BLOCKS-PER-MONTH)))
    )
    ;; V3: Enhanced validation
    (asserts! (> new-tier u0) ERR-INVALID-TIER)
    (asserts! (is-valid-tier new-tier) ERR-INVALID-TIER)
    
    ;; Transfer payment
    (try! (stx-transfer? price caller CONTRACT-OWNER))
    
    ;; Update subscription
    (map-set users caller (merge user-data {
      tier: new-tier,
      subscription-ends: new-ends,
      updated-at: block-height
    }))
    
    ;; Update revenue
    (var-set total-revenue (+ (var-get total-revenue) price))
    
    (print {
      event: "subscription-upgraded",
      version: "v3",
      user: caller,
      old-tier: current-tier,
      new-tier: new-tier,
      price: price,
      ends-at: new-ends,
      block: block-height
    })
    
    (ok new-ends)
  )
)

;; Set alert preferences only
;; @description Sets the user's alert preferences directly.
;; @param alerts The new alert bitmask.
(define-public (set-alerts (alerts uint))
  (let
    (
      (caller tx-sender)
      (user-data (unwrap! (map-get? users caller) ERR-NOT-REGISTERED))
    )
    ;; V3: Validate alerts bitmask
    (asserts! (<= alerts MAX-ALERTS-BITMASK) ERR-INVALID-ALERTS)
    
    (map-set users caller (merge user-data {
      alerts-enabled: alerts,
      updated-at: block-height
    }))
    
    (print {
      event: "alerts-updated",
      version: "v3",
      user: caller,
      alerts: alerts,
      block: block-height
    })
    
    (ok true)
  )
)

;; ============================================
;; CHAINHOOK EVENT TRACKING (V3 Enhanced)
;; ============================================

;; Track chainhook triggers per user
(define-map chainhook-triggers { user: principal, hook-type: uint } uint)

;; Chainhook types:
;; 1 = Whale Transfer Alert
;; 2 = Contract Deployed
;; 3 = NFT Mint
;; 4 = Token Launch
;; 5 = Large Swap
;; 6 = Subscription Created (this contract)
;; 7 = Alert Triggered
;; 8 = Fee Collected
;; 9 = Badge Earned

;; @description Returns the total number of triggers recorded for a specific user and hook type.
;; @param user The principal of the user.
;; @param hook-type The type of chainhook (1-9).
(define-read-only (get-trigger-count (user principal) (hook-type uint))
  (default-to u0 (map-get? chainhook-triggers { user: user, hook-type: hook-type }))
)

;; Record a chainhook trigger (called by authorized services or contracts)
;; @description Records a chainhook trigger event.
;; @param user The target user principal.
;; @param hook-type The type identifier for the triggered hook.
(define-public (record-chainhook-trigger (user principal) (hook-type uint))
  (let
    (
      (current-count (get-trigger-count user hook-type))
      (user-data (map-get? users user))
    )
    ;; Only contract owner or the user themselves can record
    (asserts! (or (is-eq tx-sender CONTRACT-OWNER) 
                  (is-eq tx-sender user)) ERR-NOT-AUTHORIZED)
    
    ;; V3: Validate hook type (1-9)
    (asserts! (and (>= hook-type HOOK-WHALE-TRANSFER) (<= hook-type HOOK-BADGE-EARNED)) ERR-INVALID-HOOK-TYPE)
    
    ;; Update trigger count
    (map-set chainhook-triggers { user: user, hook-type: hook-type } (+ current-count u1))
    
    ;; V3: Also update user's total triggers if registered
    (match user-data
      data (map-set users user (merge data {
        total-triggers: (+ (get total-triggers data) u1),
        updated-at: block-height
      }))
      true
    )
    
    (print {
      event: "chainhook-recorded",
      version: "v3",
      user: user,
      hook-type: hook-type,
      total-triggers: (+ current-count u1),
      block: block-height
    })
    
    (ok (+ current-count u1))
  )
)

;; Get all chainhook stats for a user
;; @description Returns a consolidated report of all chainhook trigger stats for a user.
;; @param user The principal of the user.
(define-read-only (get-user-chainhook-stats (user principal))
  {
    whale-alerts: (get-trigger-count user HOOK-WHALE-TRANSFER),
    contract-deploys: (get-trigger-count user HOOK-CONTRACT-DEPLOY),
    nft-mints: (get-trigger-count user HOOK-NFT-MINT),
    token-launches: (get-trigger-count user HOOK-TOKEN-LAUNCH),
    large-swaps: (get-trigger-count user HOOK-LARGE-SWAP),
    subscriptions: (get-trigger-count user HOOK-SUBSCRIPTION-CREATED),
    alerts-triggered: (get-trigger-count user HOOK-ALERT-TRIGGERED),
    fees-collected: (get-trigger-count user HOOK-FEE-COLLECTED),
    badges-earned: (get-trigger-count user HOOK-BADGE-EARNED)
  }
)

;; ============================================
;; ADMIN FUNCTIONS
;; ============================================

;; Withdraw collected fees (owner only)
;; @description Allows the contract owner to withdraw collected fees.
;; @param amount The amount in microSTX to withdraw.
;; @param recipient The principal to receive the funds.
(define-public (withdraw-fees (amount uint) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (try! (as-contract (stx-transfer? amount tx-sender recipient)))
    
    (print {
      event: "fees-withdrawn",
      version: "v3",
      amount: amount,
      recipient: recipient,
      block: block-height
    })
    
    (ok true)
  )
)

;; Admin grant subscription (for promotions, etc.)
;; @description Allows the contract owner to grant a subscription tier and duration to a user (e.g., for trials or rewards).
;; @param user The target user principal.
;; @param tier The subscription tier to grant.
;; @param duration-blocks The length of the grant in blocks.
(define-public (admin-grant-subscription (user principal) (tier uint) (duration-blocks uint))
  (let
    (
      (user-data (unwrap! (map-get? users user) ERR-NOT-REGISTERED))
    )
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (asserts! (is-valid-tier tier) ERR-INVALID-TIER)
    
    (map-set users user (merge user-data {
      tier: tier,
      subscription-ends: (+ block-height duration-blocks),
      updated-at: block-height
    }))
    
    (print {
      event: "admin-grant",
      version: "v3",
      user: user,
      tier: tier,
      duration: duration-blocks,
      block: block-height
    })
    
    (ok true)
  )
)
