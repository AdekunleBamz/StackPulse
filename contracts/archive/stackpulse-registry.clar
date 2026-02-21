;; StackPulse Registry Contract
;; User registration, subscriptions, and tier management

;; Constants
(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-ALREADY-REGISTERED (err u101))
(define-constant ERR-NOT-REGISTERED (err u102))
(define-constant ERR-INVALID-TIER (err u103))
(define-constant ERR-INSUFFICIENT-FUNDS (err u104))

;; Subscription duration in blocks (~30 days)
(define-constant SUBSCRIPTION-DURATION u4320)

;; Data vars
(define-data-var total-users uint u0)
(define-data-var next-user-id uint u1)

;; Data maps
(define-map users principal
  {
    user-id: uint,
    username: (string-ascii 32),
    tier: uint,
    subscription-expires: uint,
    total-alerts: uint,
    referrer: (optional principal),
    registered-at: uint
  }
)

(define-map tier-prices uint uint)

;; Initialize tier prices
(map-set tier-prices u1 u1000000)    ;; Basic: 1 STX
(map-set tier-prices u2 u5000000)    ;; Pro: 5 STX
(map-set tier-prices u3 u20000000)   ;; Premium: 20 STX

;; Read-only functions
(define-read-only (get-user (user principal))
  (map-get? users user)
)

(define-read-only (get-tier-price (tier uint))
  (ok (default-to u0 (map-get? tier-prices tier)))
)

(define-read-only (get-total-users)
  (var-get total-users)
)

(define-read-only (is-subscribed (user principal))
  (match (map-get? users user)
    user-data (> (get subscription-expires user-data) stacks-block-height)
    false
  )
)

;; Public functions
(define-public (register (username (string-ascii 32)) (referrer (optional principal)))
  (let
    (
      (caller tx-sender)
      (user-id (var-get next-user-id))
    )
    (asserts! (is-none (map-get? users caller)) ERR-ALREADY-REGISTERED)
    
    (map-set users caller {
      user-id: user-id,
      username: username,
      tier: u0,
      subscription-expires: u0,
      total-alerts: u0,
      referrer: referrer,
      registered-at: stacks-block-height
    })
    
    (var-set next-user-id (+ user-id u1))
    (var-set total-users (+ (var-get total-users) u1))
    
    (print {
      event: "user-registered",
      user: caller,
      username: username,
      referrer: referrer,
      block: stacks-block-height
    })
    
    (ok user-id)
  )
)

(define-public (subscribe (tier uint))
  (let
    (
      (caller tx-sender)
      (price (try! (get-tier-price tier)))
      (user-data (unwrap! (map-get? users caller) ERR-NOT-REGISTERED))
      (current-expires (get subscription-expires user-data))
      (new-expires (if (> current-expires stacks-block-height)
                      (+ current-expires SUBSCRIPTION-DURATION)
                      (+ stacks-block-height SUBSCRIPTION-DURATION)))
    )
    (asserts! (> tier u0) ERR-INVALID-TIER)
    (asserts! (<= tier u3) ERR-INVALID-TIER)
    
    ;; Transfer subscription fee
    (try! (stx-transfer? price caller CONTRACT-OWNER))
    
    ;; Update user subscription
    (map-set users caller (merge user-data {
      tier: tier,
      subscription-expires: new-expires
    }))
    
    (print {
      event: "subscription-created",
      user: caller,
      tier: tier,
      price: price,
      expires-at: new-expires,
      block: stacks-block-height
    })
    
    (ok new-expires)
  )
)

(define-public (increment-alerts (user principal))
  (let
    (
      (user-data (unwrap! (map-get? users user) ERR-NOT-REGISTERED))
    )
    (map-set users user (merge user-data {
      total-alerts: (+ (get total-alerts user-data) u1)
    }))
    (ok true)
  )
)
