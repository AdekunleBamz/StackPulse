;; StackPulse Reputation Badges V3 (SIP-009 NFT)
;; =========================================================================
;; This contract implements the SIP-009 NFT standard for reputation badges.
;; Badges are awarded to users for reaching platform milestones, 
;; achievements, and community contributions.
;;
;; Badge Types and Categories:
;; 1 = Early Adopter (Limited to first 100 users)
;; 2 = Whale Watcher (Detected 10+ significant whale transfers)
;; 3 = Alert Master (Created 25+ customized alerts)
;; 4 = Power User (Subscribed to Pro or Premium tiers)
;; 5 = Referral Champion (Successfully referred 5+ new users)
;; 6 = Year One (Maintained active subscription for 1 year)
;; 7 = Community Builder (Active participation in governance)
;; 8 = Bug Hunter (Validation of reported technical issues)
;; 9 = StackPulse OG (Original beta testing participants)

;; =========================================================================
;; SIP-009 NFT TRAIT INTEGRATION
;; =========================================================================

(impl-trait 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait.nft-trait)

;; =========================================================================
;; CONSTANTS
;; =========================================================================

;; Contract administrative authority
(define-constant CONTRACT-OWNER tx-sender)

;; ERROR CODES
(define-constant ERR-NOT-AUTHORIZED (err u100))      ;; Identity-based permission failure
(define-constant ERR-NOT-FOUND (err u101))           ;; Resource or Badge ID not located
(define-constant ERR-ALREADY-MINTED (err u102))      ;; User already holds this specific badge
(define-constant ERR-INVALID-BADGE (err u103))       ;; Referenced badge type is undefined
(define-constant ERR-PAUSED (err u104))              ;; Contract is in emergency pause state

;; METADATA PARAMETERS
(define-constant BASE-URI "https://stackpulse.vercel.app/api/badges/")

;; =========================================================================
;; NFT DEFINITION
;; =========================================================================

(define-non-fungible-token stackpulse-badge uint)

;; =========================================================================
;; DATA STORAGE
;; =========================================================================

;; GLOBAL STATE
(define-data-var last-token-id uint u0)
(define-data-var total-badges-minted uint u0)
(define-data-var is-paused bool false)
(define-data-var royalty-percent-bps uint u500)      ;; 5% Standard secondary royalties

;; METADATA MAPPINGS
;; Primary storage for individual badge statistics
(define-map badge-data uint
  {
    badge-type: uint,
    name: (string-ascii 64),
    recipient: principal,
    minted-at: uint
  }
)

;; Inverse lookup for user badges [user, type] -> token-id
(define-map user-badges { user: principal, badge-type: uint } uint)

;; Core configuration for badge categories
(define-map badge-definitions uint 
  {
    name: (string-ascii 64),
    description: (string-ascii 256),
    max-supply: uint,                               ;; 0 indicates unlimited supply
    minted-count: uint
  }
)

;; LIST OF AUTHORIZED MINTERS (e.g., other StackPulse contracts)
(define-map authorized-minters principal bool)

;; =========================================================================
;; INITIALIZATION: BOOTSTRAP BADGE CATEGORIES
;; =========================================================================

(map-set badge-definitions u1 { name: "Early Adopter", description: "Among the first 100 StackPulse users", max-supply: u100, minted-count: u0 })
(map-set badge-definitions u2 { name: "Whale Watcher", description: "Detected 10+ whale transfers", max-supply: u0, minted-count: u0 })
(map-set badge-definitions u3 { name: "Alert Master", description: "Created 25+ alerts", max-supply: u0, minted-count: u0 })
(map-set badge-definitions u4 { name: "Power User", description: "Pro or Premium subscriber", max-supply: u0, minted-count: u0 })
(map-set badge-definitions u5 { name: "Referral Champion", description: "Referred 5+ users", max-supply: u0, minted-count: u0 })
(map-set badge-definitions u6 { name: "Year One", description: "Active for 1 year", max-supply: u0, minted-count: u0 })
(map-set badge-definitions u7 { name: "Community Builder", description: "Active in governance", max-supply: u0, minted-count: u0 })
(map-set badge-definitions u8 { name: "Bug Hunter", description: "Reported valid bugs", max-supply: u0, minted-count: u0 })
(map-set badge-definitions u9 { name: "StackPulse OG", description: "Original beta tester", max-supply: u50, minted-count: u0 })

;; =========================================================================
;; SIP-009 REQUIRED FUNCTIONS
;; =========================================================================

;; Returns the most recently minted token ID
(define-read-only (get-last-token-id)
  (ok (var-get last-token-id))
)

;; Returns off-chain metadata URI for a specific badge
(define-read-only (get-token-uri (token-id uint))
  (ok (some (concat BASE-URI (uint-to-string token-id))))
)

;; Returns the current owner of a badge token
(define-read-only (get-owner (token-id uint))
  (ok (nft-get-owner? stackpulse-badge token-id))
)

;; Standard NFT Transfer function
(define-public (transfer (token-id uint) (sender principal) (recipient principal))
  (begin
    (asserts! (not (var-get is-paused)) ERR-PAUSED)  ;; Crisis prevention
    (asserts! (is-eq tx-sender sender) ERR-NOT-AUTHORIZED)
    (nft-transfer? stackpulse-badge token-id sender recipient)
  )
)

;; =========================================================================
;; READ-ONLY FUNCTIONS
;; =========================================================================

;; Retrieves core data for a badge token
(define-read-only (get-badge-data (token-id uint))
  (map-get? badge-data token-id)
)

;; Retrieves the configuration for a badge category
(define-read-only (get-badge-definition (badge-type uint))
  (map-get? badge-definitions badge-type)
)

;; Quick check if a user owns a specific category of badge
(define-read-only (has-badge (user principal) (badge-type uint))
  (is-some (map-get? user-badges { user: user, badge-type: badge-type }))
)

;; Returns the token ID of a specific badge type for a user
(define-read-only (get-user-badge-token (user principal) (badge-type uint))
  (map-get? user-badges { user: user, badge-type: badge-type })
)

;; Contract-wide statistics
(define-read-only (get-stats)
  {
    total-minted: (var-get total-badges-minted),
    last-id: (var-get last-token-id)
  }
)

;; Check provided address for minting authorization
(define-read-only (is-authorized-minter (minter principal))
  (default-to false (map-get? authorized-minters minter))
)

;; Standardized royalty reporting for external marketplaces
(define-read-only (get-royalty-info)
  (ok {
    receiver: CONTRACT-OWNER,
    percent-bps: (var-get royalty-percent-bps)
  })
)

;; =========================================================================
;; PUBLIC FUNCTIONS
;; =========================================================================

;; MINT: Assign a badge category to a recipient
;; =========================================================================
;; @param recipient: Target identity for the badge
;; @param badge-type: Category ID [1-9]
(define-public (mint-badge (recipient principal) (badge-type uint))
  (let
    (
      (token-id (+ (var-get last-token-id) u1))
      (badge-def (unwrap! (map-get? badge-definitions badge-type) ERR-INVALID-BADGE))
    )
    ;; Capability and environment checks
    (asserts! (not (var-get is-paused)) ERR-PAUSED)
    (asserts! (or (is-eq tx-sender CONTRACT-OWNER) 
                  (is-authorized-minter tx-sender)) ERR-NOT-AUTHORIZED)
    
    ;; Integrity check: No duplicate badges of the same type for a user
    (asserts! (not (has-badge recipient badge-type)) ERR-ALREADY-MINTED)
    
    ;; Supply restriction check
    (asserts! (or (is-eq (get max-supply badge-def) u0)
                  (< (get minted-count badge-def) (get max-supply badge-def))) 
              ERR-NOT-AUTHORIZED)
    
    ;; SIP-009 Mint
    (try! (nft-mint? stackpulse-badge token-id recipient))
    
    ;; Data persistence
    (map-set badge-data token-id {
      badge-type: badge-type,
      name: (get name badge-def),
      recipient: recipient,
      minted-at: block-height
    })
    
    (map-set user-badges { user: recipient, badge-type: badge-type } token-id)
    
    ;; Counter updates
    (map-set badge-definitions badge-type (merge badge-def {
      minted-count: (+ (get minted-count badge-def) u1)
    }))
    
    (var-set last-token-id token-id)
    (var-set total-badges-minted (+ (var-get total-badges-minted) u1))
    
    ;; Logging
    (print {
      event: "badge-earned",
      token-id: token-id,
      recipient: recipient,
      badge-type: badge-type,
      badge-name: (get name badge-def),
      block: block-height
    })
    
    (ok token-id)
  )
)

;; =========================================================================
;; ADMIN FUNCTIONS
;; =========================================================================

;; AUTH: Register a contract or address as an authorized minter
(define-public (add-minter (minter principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (map-set authorized-minters minter true)
    (ok true)
  )
)

;; AUTH: De-authorize a minter
(define-public (remove-minter (minter principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (map-delete authorized-minters minter)
    (ok true)
  )
)

;; ROYALTIES: Adjust secondary market payout percentage
(define-public (set-royalty-percent (new-bps uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (asserts! (<= new-bps u1000) ERR-NOT-AUTHORIZED) ;; Capped at 10%
    (var-set royalty-percent-bps new-bps)
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

;; BATCH: Efficiently distribute badges to multiple users
(define-public (batch-mint-badges (recipients (list 20 { r: principal, t: uint })))
  (ok (map mint-single-badge recipients))
)

(define-private (mint-single-badge (item { r: principal, t: uint }))
  (mint-badge (get r item) (get t item))
)

;; =========================================================================
;; UTILITIES: INTERNAL HELPERS
;; =========================================================================

;; Numeric formatting for URI concatenation
(define-read-only (uint-to-string (value uint))
  (if (<= value u9)
    (unwrap-panic (element-at "0123456789" value))
    (get r (fold uint-to-string-iter
      (list u0 u1 u2 u3 u4 u5 u6 u7 u8 u9)
      { n: value, r: "" }))
  )
)

(define-private (uint-to-string-iter (idx uint) (state { n: uint, r: (string-ascii 10) }))
  (if (> (get n state) u0)
    {
      n: (/ (get n state) u10),
      r: (unwrap-panic (as-max-len? 
        (concat (unwrap-panic (element-at "0123456789" (mod (get n state) u10))) (get r state)) 
        u10))
    }
    state
  )
)
