;; Fee Vault Contract
;; Protocol fees, staking, and rewards

;; Constants
(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u300))
(define-constant ERR-INSUFFICIENT-BALANCE (err u301))
(define-constant ERR-NO-STAKE (err u302))

;; Fee split percentages (in basis points, 10000 = 100%)
(define-constant TREASURY-SHARE u5000)  ;; 50%
(define-constant STAKER-SHARE u4000)    ;; 40%
(define-constant REFERRAL-SHARE u1000)  ;; 10%

;; Data vars
(define-data-var total-fees-collected uint u0)
(define-data-var total-staked uint u0)
(define-data-var treasury-balance uint u0)

;; Data maps
(define-map stakers principal
  {
    amount: uint,
    rewards-claimed: uint,
    staked-at: uint
  }
)

;; Read-only functions
(define-read-only (get-staker-info (staker principal))
  (map-get? stakers staker)
)

(define-read-only (get-total-staked)
  (var-get total-staked)
)

(define-read-only (get-treasury-balance)
  (var-get treasury-balance)
)

(define-read-only (get-total-fees)
  (var-get total-fees-collected)
)

;; Public functions
(define-public (collect-fee (source (string-ascii 32)) (amount uint))
  (let
    (
      (treasury-amount (/ (* amount TREASURY-SHARE) u10000))
      (staker-amount (/ (* amount STAKER-SHARE) u10000))
    )
    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
    
    (var-set total-fees-collected (+ (var-get total-fees-collected) amount))
    (var-set treasury-balance (+ (var-get treasury-balance) treasury-amount))
    
    (print {
      event: "fee-collected",
      source: source,
      amount: amount,
      treasury-share: treasury-amount,
      staker-share: staker-amount,
      block: stacks-block-height
    })
    
    (ok amount)
  )
)

(define-public (stake (amount uint))
  (let
    (
      (caller tx-sender)
      (current-stake (default-to { amount: u0, rewards-claimed: u0, staked-at: u0 } 
                       (map-get? stakers caller)))
    )
    (try! (stx-transfer? amount caller (as-contract tx-sender)))
    
    (map-set stakers caller {
      amount: (+ (get amount current-stake) amount),
      rewards-claimed: (get rewards-claimed current-stake),
      staked-at: (if (is-eq (get amount current-stake) u0) 
                    stacks-block-height 
                    (get staked-at current-stake))
    })
    
    (var-set total-staked (+ (var-get total-staked) amount))
    
    (print {
      event: "staked",
      staker: caller,
      amount: amount,
      total-staked: (var-get total-staked),
      block: stacks-block-height
    })
    
    (ok amount)
  )
)

(define-public (unstake (amount uint))
  (let
    (
      (caller tx-sender)
      (stake-data (unwrap! (map-get? stakers caller) ERR-NO-STAKE))
    )
    (asserts! (>= (get amount stake-data) amount) ERR-INSUFFICIENT-BALANCE)
    
    (try! (as-contract (stx-transfer? amount tx-sender caller)))
    
    (if (is-eq (get amount stake-data) amount)
      (map-delete stakers caller)
      (map-set stakers caller (merge stake-data {
        amount: (- (get amount stake-data) amount)
      }))
    )
    
    (var-set total-staked (- (var-get total-staked) amount))
    
    (print {
      event: "unstaked",
      staker: caller,
      amount: amount,
      block: stacks-block-height
    })
    
    (ok amount)
  )
)
