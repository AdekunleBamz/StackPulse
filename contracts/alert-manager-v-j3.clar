;; StackPulse Alert Manager V3
;; =========================================================================
;; This contract manages user alerts for different blockchain events.
;; It handles alert creation, status management (toggle/delete), 
;; and trigger recording from off-chain services like chainhooks.
;;
;; Upgrades from V2:
;; - Enhanced error handling with descriptive codes
;; - Optimized gas usage through minimized map lookups
;; - Improved alert tracking with detailed metadata (creation/trigger times)
;; - Batch-ready data structures for future efficiency
;; - Better chainhook integration through standardized events
;;
;; Alert Types (matching system-wide event IDs):
;; 1 = Whale Transfer (> threshold STX)
;; 2 = Contract Deployed (New contract on-chain)
;; 3 = NFT Mint (SIP-009 event)
;; 4 = Token Launch (SIP-010 event)
;; 5 = Large Swap (DEX activity)
;; 6 = Custom Address Watch (Specific principal activity)

;; =========================================================================
;; CONSTANTS
;; =========================================================================

;; Contract owner for administrative actions (e.g., moderation, status resets)
(define-constant CONTRACT-OWNER tx-sender)

;; ERROR CODES
(define-constant ERR-NOT-AUTHORIZED (err u100))      ;; Caller doesn't own the resource
(define-constant ERR-NOT-REGISTERED (err u101))      ;; User hasn't registered in StackPulse
(define-constant ERR-ALERT-NOT-FOUND (err u102))     ;; Referenced alert ID doesn't exist
(define-constant ERR-MAX-ALERTS-REACHED (err u103))  ;; User hit their tier's alert limit
(define-constant ERR-INVALID-ALERT-TYPE (err u104))  ;; Alert type outside valid [1-6] range
(define-constant ERR-INVALID-NAME (err u105))        ;; Alert name is empty or too long
(define-constant ERR-ALERT-DISABLED (err u106))      ;; Action attempted on a disabled alert
(define-constant ERR-DUPLICATE-ALERT (err u107))      ;; Redundant alert configuration

;; TIER LIMITS (Defined by StackPulse Subscription Model)
(define-constant MAX-ALERTS-FREE u3)
(define-constant MAX-ALERTS-BASIC u10)
(define-constant MAX-ALERTS-PRO u25)
(define-constant MAX-ALERTS-PREMIUM u999)

;; VALIDATION PARAMETERS
(define-constant MIN-ALERT-TYPE u1)
(define-constant MAX-ALERT-TYPE u6)

;; =========================================================================
;; DATA STORAGE
;; =========================================================================

;; Counters for ID assignment and global statistics
(define-data-var next-alert-id uint u1)
(define-data-var total-alerts uint u0)
(define-data-var total-triggers uint u0)
(define-data-var contract-version (string-ascii 8) "v3.0.0")

;; PRIMARY STORAGE: Central map for all alert details
(define-map alerts uint
  {
    owner: principal,                ;; User who created the alert
    alert-type: uint,               ;; Event category [1-6]
    name: (string-ascii 64),        ;; User-defined label
    target-address: (optional principal), ;; Optional specific address to watch
    threshold: uint,                ;; Numeric parameter (e.g., STX amount)
    enabled: bool,                  ;; Active/Passive status
    trigger-count: uint,            ;; Historical trigger frequency
    last-triggered: uint,           ;; Block height of most recent event
    created-at: uint                ;; Block height at creation
  }
)

;; LOOKUP OPTIMIZATIONS
;; Tracks how many alerts a principal has created
(define-map user-alert-count principal uint)

;; Maps a user's index [0...count-1] to a global alert ID for easy listing
(define-map user-alerts { user: principal, index: uint } uint)

;; Tracks count per alert type for user-level analytics and reporting
(define-map user-alert-types { user: principal, alert-type: uint } uint)

;; =========================================================================
;; READ-ONLY FUNCTIONS
;; =========================================================================

;; Returns currently deployed contract version
(define-read-only (get-version)
  (var-get contract-version)
)

;; Retrieves full metadata for a specific alert ID
(define-read-only (get-alert (alert-id uint))
  (map-get? alerts alert-id)
)

;; Returns total number of alerts owned by a principal
(define-read-only (get-user-alert-count (user principal))
  (default-to u0 (map-get? user-alert-count user))
)

;; Internal logic for determining tier-based alert limits
(define-read-only (get-max-alerts-for-tier (tier uint))
  (if (is-eq tier u0) MAX-ALERTS-FREE
    (if (is-eq tier u1) MAX-ALERTS-BASIC
      (if (is-eq tier u2) MAX-ALERTS-PRO
        MAX-ALERTS-PREMIUM)))
)

;; Returns alert details for a user based on sequential index
(define-read-only (get-user-alert-by-index (user principal) (index uint))
  (match (map-get? user-alerts { user: user, index: index })
    alert-id (map-get? alerts alert-id)
    none
  )
)

;; Returns global dashboard statistics
(define-read-only (get-stats)
  {
    total-alerts: (var-get total-alerts),
    total-triggers: (var-get total-triggers),
    next-id: (var-get next-alert-id),
    version: (var-get contract-version)
  }
)

;; Returns frequency of specific alert types for a user
(define-read-only (get-user-alert-type-count (user principal) (alert-type uint))
  (default-to u0 (map-get? user-alert-types { user: user, alert-type: alert-type }))
)

;; Simple check for alert status (active/inactive)
(define-read-only (is-alert-active (alert-id uint))
  (match (map-get? alerts alert-id)
    alert-data (get enabled alert-data)
    false
  )
)

;; =========================================================================
;; PRIVATE HELPER FUNCTIONS
;; =========================================================================

;; Validates that the provided ID matches a known alert category
(define-private (is-valid-alert-type (alert-type uint))
  (and (>= alert-type MIN-ALERT-TYPE) (<= alert-type MAX-ALERT-TYPE))
)

;; Validates that alert names are present and within length constraints
(define-private (is-valid-name (name (string-ascii 64)))
  (and (> (len name) u0) (<= (len name) u64))
)

;; =========================================================================
;; PUBLIC FUNCTIONS
;; =========================================================================

;; CREATION: Register a new alert for the calling principal
;; =========================================================================
;; @param alert-type: ID representing the event category [1-6]
;; @param name: Descriptive label for the user
;; @param target-address: Optional principal to monitor
;; @param threshold: Numeric value for event filtering (e.g., min STX)
;; @param user-tier: Current subscription level for limit validation
(define-public (create-alert 
    (alert-type uint)
    (name (string-ascii 64))
    (target-address (optional principal))
    (threshold uint)
    (user-tier uint))
  (let
    (
      (caller tx-sender)
      (alert-id (var-get next-alert-id))
      (current-count (get-user-alert-count caller))
      (max-allowed (get-max-alerts-for-tier user-tier))
      (type-count (get-user-alert-type-count caller alert-type))
    )
    ;; Comprehensive input validation
    (asserts! (is-valid-alert-type alert-type) ERR-INVALID-ALERT-TYPE)
    (asserts! (is-valid-name name) ERR-INVALID-NAME)
    (asserts! (< current-count max-allowed) ERR-MAX-ALERTS-REACHED)
    
    ;; Persist alert data
    (map-set alerts alert-id {
      owner: caller,
      alert-type: alert-type,
      name: name,
      target-address: target-address,
      threshold: threshold,
      enabled: true,
      trigger-count: u0,
      last-triggered: u0,
      created-at: block-height
    })
    
    ;; Update tracking maps
    (map-set user-alert-count caller (+ current-count u1))
    (map-set user-alerts { user: caller, index: current-count } alert-id)
    (map-set user-alert-types { user: caller, alert-type: alert-type } (+ type-count u1))
    
    ;; Increment global identifiers
    (var-set next-alert-id (+ alert-id u1))
    (var-set total-alerts (+ (var-get total-alerts) u1))
    
    ;; Emit event for indexer alignment
    (print {
      event: "alert-created",
      version: "v3",
      alert-id: alert-id,
      owner: caller,
      alert-type: alert-type,
      name: name,
      threshold: threshold,
      block: block-height
    })
    
    (ok alert-id)
  )
)

;; TOGGLE: Enable or Disable an existing alert
;; =========================================================================
;; @param alert-id: The ID of the alert to update
(define-public (toggle-alert (alert-id uint))
  (let
    (
      (caller tx-sender)
      (alert-data (unwrap! (map-get? alerts alert-id) ERR-ALERT-NOT-FOUND))
      (new-enabled (not (get enabled alert-data)))
    )
    ;; Ownership check
    (asserts! (is-eq (get owner alert-data) caller) ERR-NOT-AUTHORIZED)
    
    ;; Update enabled status
    (map-set alerts alert-id (merge alert-data {
      enabled: new-enabled
    }))
    
    ;; Emit event
    (print {
      event: "alert-toggled",
      version: "v3",
      alert-id: alert-id,
      enabled: new-enabled,
      block: block-height
    })
    
    (ok new-enabled)
  )
)

;; DELETE: Permanently remove an alert from tracking
;; =========================================================================
;; @param alert-id: The ID of the alert to remove
(define-public (delete-alert (alert-id uint))
  (let
    (
      (caller tx-sender)
      (alert-data (unwrap! (map-get? alerts alert-id) ERR-ALERT-NOT-FOUND))
      (current-count (get-user-alert-count caller))
      (alert-type (get alert-type alert-data))
      (type-count (get-user-alert-type-count caller alert-type))
    )
    ;; Ownership check
    (asserts! (is-eq (get owner alert-data) caller) ERR-NOT-AUTHORIZED)
    
    ;; Physical deletion from map
    (map-delete alerts alert-id)
    
    ;; Consistent count decrementing
    (map-set user-alert-count caller (- current-count u1))
    (if (> type-count u0)
      (map-set user-alert-types { user: caller, alert-type: alert-type } (- type-count u1))
      true
    )
    
    ;; Emit event for server synchronization
    (print {
      event: "alert-deleted",
      version: "v3",
      alert-id: alert-id,
      owner: caller,
      alert-type: alert-type,
      block: block-height
    })
    
    (ok true)
  )
)

;; RECORD TRIGGER: Mark an alert as fired (called by observer services)
;; =========================================================================
;; @param alert-id: The ID of the alert that matched an event
(define-public (record-trigger (alert-id uint))
  (let
    (
      (alert-data (unwrap! (map-get? alerts alert-id) ERR-ALERT-NOT-FOUND))
      (new-trigger-count (+ (get trigger-count alert-data) u1))
    )
    ;; Authorized sources: The alert owner or the administrative owner
    (asserts! (or (is-eq tx-sender (get owner alert-data)) 
                  (is-eq tx-sender CONTRACT-OWNER)) ERR-NOT-AUTHORIZED)
    
    ;; Guard against triggers on disabled alerts
    (asserts! (get enabled alert-data) ERR-ALERT-DISABLED)
    
    ;; Update historical trigger data
    (map-set alerts alert-id (merge alert-data {
      trigger-count: new-trigger-count,
      last-triggered: block-height
    }))
    
    ;; Aggregated platform metrics
    (var-set total-triggers (+ (var-get total-triggers) u1))
    
    ;; Real-time event propagation
    (print {
      event: "alert-triggered",
      version: "v3",
      alert-id: alert-id,
      owner: (get owner alert-data),
      alert-type: (get alert-type alert-data),
      trigger-count: new-trigger-count,
      block: block-height
    })
    
    (ok new-trigger-count)
  )
)

;; UPDATE: Modify existing alert parameters without ID mutation
;; =========================================================================
;; @param name: New label for the alert
;; @param target-address: Updated specific address (optional)
;; @param threshold: Updated numeric filter value
(define-public (update-alert 
    (alert-id uint)
    (name (string-ascii 64))
    (target-address (optional principal))
    (threshold uint))
  (let
    (
      (caller tx-sender)
      (alert-data (unwrap! (map-get? alerts alert-id) ERR-ALERT-NOT-FOUND))
    )
    ;; Security: Only the creator can modify settings
    (asserts! (is-eq (get owner alert-data) caller) ERR-NOT-AUTHORIZED)
    
    ;; Re-validate inputs
    (asserts! (is-valid-name name) ERR-INVALID-NAME)
    
    ;; Atomic update through merge
    (map-set alerts alert-id (merge alert-data {
      name: name,
      target-address: target-address,
      threshold: threshold
    }))
    
    ;; Change event
    (print {
      event: "alert-updated",
      version: "v3",
      alert-id: alert-id,
      name: name,
      threshold: threshold,
      block: block-height
    })
    
    (ok true)
  )
)

;; =========================================================================
;; ADMIN FUNCTIONS
;; =========================================================================

;; MODERATION: Forcefully enable/disable alerts (Emergency use only)
;; =========================================================================
;; @param alert-id: Targeted alert
;; @param enabled: Target status
(define-public (admin-set-alert-status (alert-id uint) (enabled bool))
  (let
    (
      (alert-data (unwrap! (map-get? alerts alert-id) ERR-ALERT-NOT-FOUND))
    )
    ;; Strict administrative restriction
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    
    ;; Forced status update
    (map-set alerts alert-id (merge alert-data {
      enabled: enabled
    }))
    
    ;; Management event
    (print {
      event: "admin-alert-status",
      version: "v3",
      alert-id: alert-id,
      enabled: enabled,
      block: block-height
    })
    
    (ok true)
  )
)
