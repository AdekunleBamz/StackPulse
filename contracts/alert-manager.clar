;; Alert Manager Contract
;; Create and manage blockchain alerts

;; Constants
(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u200))
(define-constant ERR-ALERT-NOT-FOUND (err u201))
(define-constant ERR-NOT-OWNER (err u202))
(define-constant ERR-MAX-ALERTS-REACHED (err u203))

(define-constant MAX-ALERTS-PER-USER u50)

;; Data vars
(define-data-var next-alert-id uint u1)

;; Data maps
(define-map alerts uint
  {
    owner: principal,
    name: (string-ascii 64),
    alert-type: uint,
    threshold: uint,
    target-contract: (optional principal),
    is-active: bool,
    triggered-count: uint,
    created-at: uint
  }
)

(define-map user-alert-count principal uint)

;; Alert types
;; 1 = Whale transfer
;; 2 = Contract deployment
;; 3 = NFT mint
;; 4 = Token launch
;; 5 = Large swap

;; Read-only functions
(define-read-only (get-alert (alert-id uint))
  (map-get? alerts alert-id)
)

(define-read-only (get-user-alert-count (user principal))
  (default-to u0 (map-get? user-alert-count user))
)

;; Public functions
(define-public (create-alert 
    (name (string-ascii 64))
    (alert-type uint)
    (threshold uint)
    (target-contract (optional principal)))
  (let
    (
      (caller tx-sender)
      (alert-id (var-get next-alert-id))
      (current-count (get-user-alert-count caller))
    )
    (asserts! (< current-count MAX-ALERTS-PER-USER) ERR-MAX-ALERTS-REACHED)
    
    (map-set alerts alert-id {
      owner: caller,
      name: name,
      alert-type: alert-type,
      threshold: threshold,
      target-contract: target-contract,
      is-active: true,
      triggered-count: u0,
      created-at: stacks-block-height
    })
    
    (map-set user-alert-count caller (+ current-count u1))
    (var-set next-alert-id (+ alert-id u1))
    
    (print {
      event: "alert-created",
      alert-id: alert-id,
      owner: caller,
      alert-type: alert-type,
      name: name,
      threshold: threshold,
      block: stacks-block-height
    })
    
    (ok alert-id)
  )
)

(define-public (trigger-alert (alert-id uint))
  (let
    (
      (alert-data (unwrap! (map-get? alerts alert-id) ERR-ALERT-NOT-FOUND))
    )
    (map-set alerts alert-id (merge alert-data {
      triggered-count: (+ (get triggered-count alert-data) u1)
    }))
    
    (print {
      event: "alert-triggered",
      alert-id: alert-id,
      owner: (get owner alert-data),
      alert-type: (get alert-type alert-data),
      triggered-count: (+ (get triggered-count alert-data) u1),
      block: stacks-block-height
    })
    
    (ok true)
  )
)

(define-public (toggle-alert (alert-id uint))
  (let
    (
      (caller tx-sender)
      (alert-data (unwrap! (map-get? alerts alert-id) ERR-ALERT-NOT-FOUND))
    )
    (asserts! (is-eq caller (get owner alert-data)) ERR-NOT-OWNER)
    
    (map-set alerts alert-id (merge alert-data {
      is-active: (not (get is-active alert-data))
    }))
    
    (ok (not (get is-active alert-data)))
  )
)

(define-public (delete-alert (alert-id uint))
  (let
    (
      (caller tx-sender)
      (alert-data (unwrap! (map-get? alerts alert-id) ERR-ALERT-NOT-FOUND))
      (current-count (get-user-alert-count caller))
    )
    (asserts! (is-eq caller (get owner alert-data)) ERR-NOT-OWNER)
    
    (map-delete alerts alert-id)
    (map-set user-alert-count caller (- current-count u1))
    
    (ok true)
  )
)
