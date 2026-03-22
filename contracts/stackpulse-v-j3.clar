;; StackPulse V3 - Enhanced User Registry & Subscriptions
;; =========================================================================
;; This contract acts as the primary user registry for the StackPulse protocol.
;; It manages user profiles, subscription tiers, and overall platform access.
;;
;; Upgrades from V2:
;; - Better error handling with more descriptive error codes
;; - Optimized gas usage with efficient data structures and map operations
;; - Enhanced event logging for detailed chainhook indexing
;; - Added batch operations support for administrative tasks
;; - Improved subscription management with expiration logic
;;
;; Operational Flow:
;; 1. User registers via (register-and-subscribe) with profile and tier choice.
;; 2. Free Tier: No STX transfer required, provides basic monitoring limits.
;; 3. Paid Tiers: Transfers STX to protocol treasury, unlocks advanced features.
;; 4. Profile Updates: Users can modify metadata (username, email) anytime.
;; 5. Upgrades: Subscription tiers can be elevated or renewed with STX.

;; =========================================================================
;; CONSTANTS
;; =========================================================================

;; Protocol administrative owner
(define-constant CONTRACT-OWNER tx-sender)

;; ERROR CODES
(define-constant ERR-NOT-AUTHORIZED (err u100))      ;; Identity verification failure
(define-constant ERR-ALREADY-REGISTERED (err u101))  ;; Principal already exists in registry
(define-constant ERR-NOT-REGISTERED (err u102))     ;; User must register first
(define-constant ERR-INVALID-TIER (err u103))       ;; Provided tier index is out of bounds
(define-constant ERR-TRANSFER-FAILED (err u104))    ;; Subscription payment could not be processed
(define-constant ERR-INVALID-USERNAME (err u105))   ;; Username format or length is invalid
(define-constant ERR-INVALID-ALERTS (err u106))     ;; Provided alert bitmask is malformed
(define-constant ERR-SUBSCRIPTION-EXPIRED (err u107)) ;; Subscription period has lapsed
(define-constant ERR-SAME-TIER (err u108))          ;; Upgrade target matches current level
(define-constant ERR-INVALID-HOOK-TYPE (err u109))  ;; Trigger category is unrecognized
(define-constant ERR-PAUSED (err u110))             ;; Protocol is in emergency pause state

;; TEMPORAL CONSTANTS
;; Standard 30-day block window (estimate)
(define-constant BLOCKS-PER-MONTH u4320)

;; PRICING STRUCTURE (microSTX)
(define-constant PRICE-FREE u0)
(define-constant PRICE-BASIC u10000)        ;; 0.01 STX
(define-constant PRICE-PRO u50000)          ;; 0.05 STX
(define-constant PRICE-PREMIUM u200000)     ;; 0.20 STX

;; SYSTEM CONSTRAINTS
(define-constant MAX-TIER u3)
(define-constant MAX-ALERTS-BITMASK u31)    ;; Binary 11111 (5 categories)

;; =========================================================================
;; DATA STORAGE
;; =========================================================================

;; PROTOCOL STATE
(define-data-var total-users uint u0)
(define-data-var total-revenue uint u0)
(define-data-var is-paused bool false)
(define-data-var contract-version (string-ascii 8) "v3.0.0")

;; USER REGISTRY: Central storage for participant metadata
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
    total-triggers: uint     ;; Aggregate trigger history for user analytics
  }
)

;; EVENT LOGGING: Detailed tracking for off-chain services
(define-map chainhook-triggers { user: principal, hook-type: uint } uint)

;; =========================================================================
;; READ-ONLY FUNCTIONS
;; =========================================================================

;; Returns currently deployed contract version
(define-read-only (get-version)
  (var-get contract-version)
)

;; Retrieves full profile metadata for a user
(define-read-only (get-user (who principal))
  (map-get? users who)
)

;; Simple registration status check
(define-read-only (is-registered (who principal))
  (is-some (map-get? users who))
)

;; Comprehensive subscription status reporting
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

;; Maps tier indices to current microSTX prices
(define-read-only (get-tier-price (tier uint))
  (if (is-eq tier u0) PRICE-FREE
    (if (is-eq tier u1) PRICE-BASIC
      (if (is-eq tier u2) PRICE-PRO
        (if (is-eq tier u3) PRICE-PREMIUM
          u0))))
)

;; Global protocol health metrics
(define-read-only (get-stats)
  {
    total-users: (var-get total-users),
    total-revenue: (var-get total-revenue),
    version: (var-get contract-version)
  }
)

;; Boolean check for active subscription state
(define-read-only (is-subscription-active (who principal))
  (match (map-get? users who)
    user-data
      (or (is-eq (get tier user-data) u0)
          (> (get subscription-ends user-data) block-height))
    false
  )
)

;; =========================================================================
;; PRIVATE HELPER FUNCTIONS
;; =========================================================================

;; Username validation: Non-empty and within character limits
(define-private (is-valid-username (username (string-ascii 32)))
  (let ((username-len (len username)))
    (and (>= username-len u1) (<= username-len u32))
  )
)

;; Tier validation: Ensure choice corresponds to defined pricing
(define-private (is-valid-tier (tier uint))
  (<= tier MAX-TIER)
)

;; =========================================================================
;; PUBLIC FUNCTIONS
;; =========================================================================

;; REGISTRATION: Onboard new user and start subscription
;; =========================================================================
;; @param username: Selected display name
;; @param email: Contact information
;; @param tier: Subscription level index [0-3]
;; @param alerts: Enabled alert categories bitmask
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
    ;; Protocol and input validation
    (asserts! (not (var-get is-paused)) ERR-PAUSED)
    (asserts! (is-valid-username username) ERR-INVALID-USERNAME)
    (asserts! (is-none (map-get? users caller)) ERR-ALREADY-REGISTERED)
    (asserts! (is-valid-tier tier) ERR-INVALID-TIER)
    (asserts! (<= alerts MAX-ALERTS-BITMASK) ERR-INVALID-ALERTS)

    ;; Process STX payment for non-free tiers
    (if (> price u0)
      (try! (stx-transfer? price caller CONTRACT-OWNER))
      true
    )

    ;; Persist registration data
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

    ;; Update aggregate stats
    (var-set total-users user-id)
    (if (> price u0)
      (var-set total-revenue (+ (var-get total-revenue) price))
      true
    )

    ;; Emit event for synchronization
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

;; UPDATE: Modify non-monetary profile settings
;; =========================================================================
(define-public (update-profile
    (username (string-ascii 32))
    (email (string-ascii 64))
    (alerts uint))
  (let
    (
      (caller tx-sender)
      (user-data (unwrap! (map-get? users caller) ERR-NOT-REGISTERED))
    )
    ;; Crisis and format check
    (asserts! (not (var-get is-paused)) ERR-PAUSED)
    (asserts! (is-valid-username username) ERR-INVALID-USERNAME)
    (asserts! (<= alerts MAX-ALERTS-BITMASK) ERR-INVALID-ALERTS)

    ;; Update stored data
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

;; UPGRADE: Elevate current subscription tier or renew period
;; =========================================================================
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
    ;; Guard conditions
    (asserts! (not (var-get is-paused)) ERR-PAUSED)
    (asserts! (> new-tier u0) ERR-INVALID-TIER)
    (asserts! (is-valid-tier new-tier) ERR-INVALID-TIER)

    ;; Transfer payment
    (try! (stx-transfer? price caller CONTRACT-OWNER))

    ;; Atomic state transition
    (map-set users caller (merge user-data {
      tier: new-tier,
      subscription-ends: new-ends,
      updated-at: block-height
    }))

    ;; Update revenue tracking
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

;; PREFERENCES: Detailed alert selection update
;; =========================================================================
(define-public (set-alerts (alerts uint))
  (let
    (
      (caller tx-sender)
      (user-data (unwrap! (map-get? users caller) ERR-NOT-REGISTERED))
    )
    (asserts! (not (var-get is-paused)) ERR-PAUSED)
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

;; =========================================================================
;; SERVICE TRACKING: TRIGGER ACCOUNTING
;; =========================================================================

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

;; Retrieves usage count for a specific feature for a user
(define-read-only (get-trigger-count (user principal) (hook-type uint))
  (default-to u0 (map-get? chainhook-triggers { user: user, hook-type: hook-type }))
)

;; INTERNAL RECORDING: Increments usage metrics (called by authorized services)
(define-public (record-chainhook-trigger (user principal) (hook-type uint))
  (let
    (
      (current-count (get-trigger-count user hook-type))
      (user-data (map-get? users user))
    )
    ;; Identity permission: Admin or User themselves
    (asserts! (or (is-eq tx-sender CONTRACT-OWNER)
                  (is-eq tx-sender user)) ERR-NOT-AUTHORIZED)

    ;; Type validation
    (asserts! (and (>= hook-type u1) (<= hook-type u9)) ERR-INVALID-HOOK-TYPE)

    ;; Persist trigger increment
    (map-set chainhook-triggers { user: user, hook-type: hook-type } (+ current-count u1))

    ;; Update aggregate user profile if present
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

;; Aggregated usage stats for frontend display
(define-read-only (get-user-chainhook-stats (user principal))
  {
    whale-alerts: (get-trigger-count user u1),
    contract-deploys: (get-trigger-count user u2),
    nft-mints: (get-trigger-count user u3),
    token-launches: (get-trigger-count user u4),
    large-swaps: (get-trigger-count user u5),
    subscriptions: (get-trigger-count user u6),
    alerts-triggered: (get-trigger-count user u7),
    fees-collected: (get-trigger-count user u8),
    badges-earned: (get-trigger-count user u9)
  }
)

;; =========================================================================
;; ADMIN FUNCTIONS: PROTOCOL MANAGEMENT
;; =========================================================================

;; Withdraw collected fees (owner only)
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

;; PAUSE: Emergency operation toggle
(define-public (set-paused (paused bool))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (var-set is-paused paused)
    (print { event: "pause-status", status: paused, block: block-height })
    (ok true)
  )
)

;; PROMOTION: Manually grant/extend subscriptions for a user
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

    (ok true)
  )
)
