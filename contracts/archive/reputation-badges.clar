;; Reputation Badges Contract
;; NFT badges for achievements and gamification

;; Implement SIP-009 NFT trait
(impl-trait 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait.nft-trait)

;; Constants
(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u400))
(define-constant ERR-NOT-FOUND (err u401))
(define-constant ERR-ALREADY-CLAIMED (err u402))
(define-constant ERR-NOT-ELIGIBLE (err u403))

;; Define NFT
(define-non-fungible-token reputation-badge uint)

;; Data vars
(define-data-var token-id-nonce uint u0)

;; Badge types
(define-map badge-types uint
  {
    name: (string-ascii 64),
    description: (string-ascii 256),
    rarity: (string-ascii 16),
    requirement: uint
  }
)

;; User badges
(define-map user-badges { user: principal, badge-type: uint } uint)

;; Token metadata
(define-map token-metadata uint
  {
    badge-type: uint,
    minted-at: uint,
    achievement: (string-ascii 128)
  }
)

;; Initialize badge types
(map-set badge-types u1 {
  name: "Early Adopter",
  description: "One of the first StackPulse users",
  rarity: "legendary",
  requirement: u0
})

(map-set badge-types u2 {
  name: "Alert Master",
  description: "Created 10 alerts",
  rarity: "rare",
  requirement: u10
})

(map-set badge-types u3 {
  name: "Whale Watcher",
  description: "Caught 100 whale transfers",
  rarity: "epic",
  requirement: u100
})

;; SIP-009 functions
(define-read-only (get-last-token-id)
  (ok (var-get token-id-nonce))
)

(define-read-only (get-token-uri (token-id uint))
  (ok (some (concat "https://stackpulse.io/badges/" (int-to-ascii token-id))))
)

(define-read-only (get-owner (token-id uint))
  (ok (nft-get-owner? reputation-badge token-id))
)

(define-public (transfer (token-id uint) (sender principal) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender sender) ERR-NOT-AUTHORIZED)
    (nft-transfer? reputation-badge token-id sender recipient)
  )
)

;; Custom functions
(define-read-only (get-badge-type (badge-type uint))
  (map-get? badge-types badge-type)
)

(define-read-only (has-badge (user principal) (badge-type uint))
  (is-some (map-get? user-badges { user: user, badge-type: badge-type }))
)

(define-public (mint-badge (recipient principal) (badge-type uint) (achievement (string-ascii 128)))
  (let
    (
      (token-id (+ (var-get token-id-nonce) u1))
      (badge-def (unwrap! (map-get? badge-types badge-type) ERR-NOT-FOUND))
    )
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (asserts! (is-none (map-get? user-badges { user: recipient, badge-type: badge-type })) ERR-ALREADY-CLAIMED)
    
    (try! (nft-mint? reputation-badge token-id recipient))
    
    (map-set user-badges { user: recipient, badge-type: badge-type } token-id)
    (map-set token-metadata token-id {
      badge-type: badge-type,
      minted-at: stacks-block-height,
      achievement: achievement
    })
    
    (var-set token-id-nonce token-id)
    
    (print {
      event: "badge-minted",
      token-id: token-id,
      recipient: recipient,
      badge-type: badge-type,
      badge-name: (get name badge-def),
      rarity: (get rarity badge-def),
      achievement: achievement,
      block: stacks-block-height
    })
    
    (ok token-id)
  )
)
