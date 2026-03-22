;; StackPulse Fee Vault V3
;; =========================================================================
;; This contract serves as the central treasury for the StackPulse protocol.
;; It manages subscription fee collection, referral payouts, and platform 
;; fee aggregation. It also includes an emergency pause mechanism for security.
;;
;; Upgrades from V2:
;; - Enhanced error handling with descriptive codes
;; - Optimized gas usage through minimized cross-contract calls
;; - Better revenue tracking per tier for detailed analytics
;; - Improved referral system with automated payout tracking
;; - Enhanced event logging for detailed off-chain indexing
;;
;; Features:
;; - Subscription fee collection with referral integration
;; - Revenue tracking partitioned by subscription tiers
;; - Secure withdrawal to designated treasury address
;; - Referral bonus tracking and user-initiated withdrawals
;; - Emergency pause/resume functionality

;; =========================================================================
;; CONSTANTS
;; =========================================================================

;; Protocol administrative owner
(define-constant CONTRACT-OWNER tx-sender)

;; Designated address for consolidated protocol revenue
(define-constant TREASURY-ADDRESS tx-sender)

;; ERROR CODES
(define-constant ERR-NOT-AUTHORIZED (err u100))      ;; Access denied for current caller
(define-constant ERR-INVALID-AMOUNT (err u101))      ;; Value is zero or exceeds limits
(define-constant ERR-INSUFFICIENT-BALANCE (err u102)) ;; Vault lacks funds for operation
(define-constant ERR-INVALID-TIER (err u103))       ;; Provided tier ID is invalid
(define-constant ERR-ZERO-AMOUNT (err u104))        ;; Operation requires non-zero value
(define-constant ERR-SELF-REFERRAL (err u105))      ;; User cannot refer themselves
(define-constant ERR-NO-EARNINGS (err u106))        ;; No pending rewards for withdrawal
(define-constant ERR-PAUSED (err u107))             ;; Contract is in emergency pause state

;; PRICING STRUCTURE (microSTX)
(define-constant PRICE-FREE u0)
(define-constant PRICE-BASIC u10000)         ;; 0.01 STX
(define-constant PRICE-PRO u150000)          ;; 0.15 STX  
(define-constant PRICE-PREMIUM u450000)      ;; 0.45 STX

;; REVENUE DISTRIBUTION PARAMETERS
(define-constant PLATFORM-FEE-BPS u1000)     ;; 10% Protocol fee
(define-constant REFERRAL-BONUS-BPS u500)    ;; 5% Referral incentive
(define-constant MAX-TIER u3)

;; =========================================================================
;; DATA STORAGE
;; =========================================================================

;; Emergency Safeguard
(define-data-var is-paused bool false)

;; GLOBAL METRICS
(define-data-var total-collected uint u0)      ;; Aggregate STX from subscriptions
(define-data-var total-fees uint u0)           ;; Aggregate platform fees
(define-data-var total-subscriptions uint u0)  ;; Numeric count of purchases
(define-data-var total-referral-paid uint u0)  ;; Total STX sent to referrers
(define-data-var contract-balance uint u0)     ;; Current liquid STX in vault
(define-data-var contract-version (string-ascii 8) "v3.0.0")

;; ANALYTICS MAPS
;; Revenue breakdown per tier ID
(define-map tier-revenue uint uint)

;; Detailed payment history per user principal
(define-map user-payments principal 
  {
    total-paid: uint,
    last-payment: uint,
    subscription-count: uint,
    current-tier: uint
  }
)

;; REFERRAL SYSTEM STORAGE
(define-map referral-earnings principal uint)  ;; Pending withdrawal balance
(define-map referrer-of principal principal)   ;; User to Referrer link
(define-map referral-count principal uint)     ;; Number of successful referrals

;; =========================================================================
;; READ-ONLY FUNCTIONS
;; =========================================================================

;; Returns deployed contract version
(define-read-only (get-version)
  (var-get contract-version)
)

;; Calculates STX cost for a given tier
(define-read-only (get-subscription-price (tier uint))
  (if (is-eq tier u0) PRICE-FREE
    (if (is-eq tier u1) PRICE-BASIC
      (if (is-eq tier u2) PRICE-PRO
        (if (is-eq tier u3) PRICE-PREMIUM
          u0))))
)

;; Retrieves historic revenue for a specific tier
(define-read-only (get-tier-revenue (tier uint))
  (default-to u0 (map-get? tier-revenue tier))
)

;; Returns payment history for a user
(define-read-only (get-user-payments (user principal))
  (map-get? user-payments user)
)

;; Returns unclaimed referral balance
(define-read-only (get-referral-earnings (referrer principal))
  (default-to u0 (map-get? referral-earnings referrer))
)

;; Returns count of users invited by a principal
(define-read-only (get-referral-count (referrer principal))
  (default-to u0 (map-get? referral-count referrer))
)

;; Returns the referrer for a specific user
(define-read-only (get-referrer (user principal))
  (map-get? referrer-of user)
)

;; Consolidated vault performance metrics
(define-read-only (get-vault-stats)
  {
    total-collected: (var-get total-collected),
    total-fees: (var-get total-fees),
    total-subscriptions: (var-get total-subscriptions),
    total-referral-paid: (var-get total-referral-paid),
    contract-balance: (var-get contract-balance),
    tier-0-revenue: (get-tier-revenue u0),
    tier-1-revenue: (get-tier-revenue u1),
    tier-2-revenue: (get-tier-revenue u2),
    tier-3-revenue: (get-tier-revenue u3),
    version: (var-get contract-version)
  }
)

;; =========================================================================
;; PRIVATE HELPER FUNCTIONS
;; =========================================================================

;; Internal tier validation check
(define-private (is-valid-tier (tier uint))
  (<= tier MAX-TIER)
)

;; Internal royalty/bonus calculation logic
(define-private (calculate-referral-bonus (amount uint))
  (/ (* amount REFERRAL-BONUS-BPS) u10000)
)

;; =========================================================================
;; PUBLIC FUNCTIONS
;; =========================================================================

;; FEE COLLECTION: Process subscription payments and handle referrals
;; =========================================================================
;; @param tier: Target subscription level
;; @param referrer: Optional address of the user who invited the caller
(define-public (collect-subscription-fee (tier uint) (referrer (optional principal)))
  (let
    (
      (caller tx-sender)
      (price (get-subscription-price tier))
      (current-tier-revenue (get-tier-revenue tier))
      (user-data (default-to 
        { total-paid: u0, last-payment: u0, subscription-count: u0, current-tier: u0 }
        (map-get? user-payments caller)))
    )
    ;; State and input validation
    (asserts! (not (var-get is-paused)) ERR-PAUSED)
    (asserts! (is-valid-tier tier) ERR-INVALID-TIER)
    
    ;; Process non-zero transactions
    (if (> price u0)
      (begin
        ;; Atomic STX transfer to vault
        (try! (stx-transfer? price caller (as-contract tx-sender)))
        
        ;; Automated referral logic
        (match referrer
          ref-addr 
            (if (and (not (is-eq ref-addr caller)) (> price u0))
              (let
                (
                  (referral-bonus (calculate-referral-bonus price))
                  (current-earnings (get-referral-earnings ref-addr))
                  (current-ref-count (get-referral-count ref-addr))
                )
                ;; Track referral attribution and reward
                (map-set referrer-of caller ref-addr)
                (map-set referral-earnings ref-addr (+ current-earnings referral-bonus))
                (map-set referral-count ref-addr (+ current-ref-count u1))
                true
              )
              false)
          false)
        
        ;; Update aggregate metrics
        (var-set total-collected (+ (var-get total-collected) price))
        (var-set contract-balance (+ (var-get contract-balance) price))
        
        true
      )
      true)
    
    ;; Persist revenue and payment metadata
    (map-set tier-revenue tier (+ current-tier-revenue price))
    
    ;; V3: Update user payments with current tier
    (map-set user-payments caller {
      total-paid: (+ (get total-paid user-data) price),
      last-payment: block-height,
      subscription-count: (+ (get subscription-count user-data) u1),
      current-tier: tier
    })
    
    ;; Global transaction count
    (var-set total-subscriptions (+ (var-get total-subscriptions) u1))
    
    ;; Emit event for indexers
    (print {
      event: "fee-collected",
      version: "v3",
      user: caller,
      tier: tier,
      amount: price,
      referrer: referrer,
      subscription-number: (+ (get subscription-count user-data) u1),
      block: block-height
    })
    
    (ok price)
  )
)

;; PLATFORM FEES: Collect operational fees (e.g., from alert triggers)
;; =========================================================================
;; @param amount: Base amount for fee calculation
;; @param fee-type: Contextual label for the fee
(define-public (collect-platform-fee (amount uint) (fee-type (string-ascii 32)))
  (let
    (
      (caller tx-sender)
      (fee-amount (/ (* amount PLATFORM-FEE-BPS) u10000))
    )
    ;; Guard clauses
    (asserts! (not (var-get is-paused)) ERR-PAUSED)
    (asserts! (> amount u0) ERR-ZERO-AMOUNT)
    (asserts! (> fee-amount u0) ERR-INVALID-AMOUNT)
    
    ;; Transfer to vault
    (try! (stx-transfer? fee-amount caller (as-contract tx-sender)))
    
    ;; Update tracking
    (var-set total-fees (+ (var-get total-fees) fee-amount))
    (var-set contract-balance (+ (var-get contract-balance) fee-amount))
    
    (print {
      event: "platform-fee-collected",
      version: "v3",
      user: caller,
      fee-type: fee-type,
      amount: fee-amount,
      block: block-height
    })
    
    (ok fee-amount)
  )
)

;; REFERRAL WITHDRAWAL: User initiated claimed of earned bonuses
;; =========================================================================
(define-public (withdraw-referral-earnings)
  (let
    (
      (caller tx-sender)
      (earnings (get-referral-earnings caller))
    )
    ;; Validation and capability checks
    (asserts! (not (var-get is-paused)) ERR-PAUSED)
    (asserts! (> earnings u0) ERR-NO-EARNINGS)
    (asserts! (<= earnings (var-get contract-balance)) ERR-INSUFFICIENT-BALANCE)
    
    ;; Secure payout
    (try! (as-contract (stx-transfer? earnings tx-sender caller)))
    
    ;; Reconcile internal balances
    (map-set referral-earnings caller u0)
    (var-set contract-balance (- (var-get contract-balance) earnings))
    (var-set total-referral-paid (+ (var-get total-referral-paid) earnings))
    
    (print {
      event: "referral-withdrawal",
      version: "v3",
      user: caller,
      amount: earnings,
      block: block-height
    })
    
    (ok earnings)
  )
)

;; =========================================================================
;; ADMIN FUNCTIONS
;; =========================================================================

;; WITHDRAWAL: Transfer protocol revenue to treasury
;; =========================================================================
(define-public (withdraw-to-treasury (amount uint))
  (begin
    ;; Identity check
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (asserts! (> amount u0) ERR-ZERO-AMOUNT)
    (asserts! (<= amount (var-get contract-balance)) ERR-INSUFFICIENT-BALANCE)
    
    ;; Outbound transfer
    (try! (as-contract (stx-transfer? amount tx-sender TREASURY-ADDRESS)))
    
    ;; Balance reconciliation
    (var-set contract-balance (- (var-get contract-balance) amount))
    
    (print {
      event: "treasury-withdrawal",
      version: "v3",
      amount: amount,
      treasury: TREASURY-ADDRESS,
      remaining-balance: (var-get contract-balance),
      block: block-height
    })
    
    (ok amount)
  )
)

;; EMERGENCY: Evacuate all vault funds to treasury
;; =========================================================================
(define-public (emergency-withdraw)
  (let
    (
      (balance (var-get contract-balance))
    )
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (asserts! (> balance u0) ERR-ZERO-AMOUNT)
    
    ;; Total fund evacuation
    (try! (as-contract (stx-transfer? balance tx-sender TREASURY-ADDRESS)))
    
    ;; State reset
    (var-set contract-balance u0)
    
    (print {
      event: "emergency-withdrawal",
      version: "v3",
      amount: balance,
      treasury: TREASURY-ADDRESS,
      block: block-height
    })
    
    (ok balance)
  )
)

;; PAUSE: Toggle contract operating status
;; =========================================================================
(define-public (set-paused (paused bool))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (var-set is-paused paused)
    (print {
      event: "pause-status-changed",
      version: "v3",
      paused: paused,
      block: block-height
    })
    (ok true)
  )
)
