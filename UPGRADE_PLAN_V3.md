# StackPulse V3 Upgrade Plan

**Status:** Ready for deployment  
**Current Version:** V2 (deployed on mainnet)  
**Target Version:** V3 (ready to deploy)  
**Date Prepared:** December 20, 2025

---

## Overview

Upgrading from StackPulse V2 to V3 involves:
1. Creating new V3 smart contract versions
2. Redeploying contracts to mainnet
3. Updating frontend contract references
4. Updating backend contract addresses
5. Migrating chainhook predicates to V3 contracts
6. Testing the complete flow end-to-end

---

## Current Deployment Status (V2)

### Deployed Contracts (Mainnet)
```
Deployer: SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N

✅ stackpulse-v2              - User registry & subscriptions
✅ alert-manager-v2          - Alert creation & management
✅ fee-vault-v2              - Fee collection
✅ reputation-badges-v3      - Badge system (already on V3)
```

### Environment Variables (Current)
```
NEXT_PUBLIC_DEPLOYER_ADDRESS=SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N
NEXT_PUBLIC_STACKS_NETWORK=mainnet
```

### Active Chainhooks (9 total, using V2 contracts)
```
1. StackPulse-Registrations    → stackpulse-v2
2. StackPulse-AlertsTriggered  → alert-manager-v2
3. StackPulse-FeesCollected    → fee-vault-v2
4. StackPulse-BadgesEarned     → reputation-badges-v3
+ 5 more contract_call chainhooks
```

---

## Upgrade Steps

### Phase 1: Smart Contract Creation (V3 versions)

**Files to Create:**
- [ ] `/contracts/stackpulse-v3.clar` - Enhanced user registry
- [ ] `/contracts/alert-manager-v3.clar` - Improved alert management
- [ ] `/contracts/fee-vault-v3.clar` - Enhanced fee collection

**V3 Enhancement Areas:**
- Better error handling
- Optimized gas usage
- Enhanced features (if any)
- Bug fixes from V2

### Phase 2: Contract Deployment

**Commands to Execute:**
```bash
# 1. Deploy stackpulse-v3
clarinet contract publish stackpulse-v3 --network mainnet

# 2. Deploy alert-manager-v3
clarinet contract publish alert-manager-v3 --network mainnet

# 3. Deploy fee-vault-v3
clarinet contract publish fee-vault-v3 --network mainnet
```

**Output:** New contract addresses will be generated (e.g., `SP3F...stackpulse-v3`)

### Phase 3: Frontend Update

**Files to Modify:**
- [ ] `frontend/src/app/register/page.tsx`
- [ ] `frontend/src/app/dashboard/page.tsx`
- [ ] `frontend/src/components/Pricing.tsx`
- [ ] `frontend/src/components/AlertForm.tsx`
- [ ] `frontend/src/utils/stacks.ts`

**Changes Required:**

**1. In contract references, change:**
```typescript
// OLD
contractName: 'stackpulse-v2',
contractName: 'alert-manager-v2',
contractName: 'fee-vault-v2',

// NEW
contractName: 'stackpulse-v3',
contractName: 'alert-manager-v3',
contractName: 'fee-vault-v3',
```

**2. In API calls, update:**
```typescript
// OLD
`https://api.mainnet.hiro.so/v2/contracts/call-read/${DEPLOYER_ADDRESS}/stackpulse-v2/get-user`

// NEW
`https://api.mainnet.hiro.so/v2/contracts/call-read/${DEPLOYER_ADDRESS}/stackpulse-v3/get-user`
```

### Phase 4: Backend Update

**Files to Modify:**
- [ ] `server/.env`
- [ ] `server/src/services/notifications.ts` (if contract-specific logic)
- [ ] `server/src/utils/stacks.ts` (if contract ABIs referenced)

**Changes Required:**

**In `server/.env`:**
```env
# OLD
REGISTRY_CONTRACT=stackpulse-v2
ALERT_CONTRACT=alert-manager-v2
VAULT_CONTRACT=fee-vault-v2

# NEW
REGISTRY_CONTRACT=stackpulse-v3
ALERT_CONTRACT=alert-manager-v3
VAULT_CONTRACT=fee-vault-v3
```

### Phase 5: Chainhook Migration

**Update Chainhooks to Point to V3 Contracts**

Run the registration script with updated contracts:
```bash
HIRO_API_KEY=e447aec3d7d0f623c90051728d2992fd npx ts-node scripts/register-stackpulse-chainhooks-v3.ts
```

**Action Items:**
1. Update `scripts/register-stackpulse-chainhooks.ts` to use V3 contract identifiers
2. Delete old V2 chainhooks (optional, but recommended for clean up)
3. Register new V3 chainhooks

**V3 Chainhook Predicates:**
```javascript
CONTRACTS = {
  registry: 'SP3F...stackpulse-v3',
  alertManager: 'SP3F...alert-manager-v3',
  feeVault: 'SP3F...fee-vault-v3',
  badges: 'SP3F...reputation-badges-v3',
}
```

### Phase 6: Testing & Validation

**Pre-Deployment Checklist:**
- [ ] V3 contracts compile without errors
- [ ] V3 contracts deploy successfully to mainnet
- [ ] Frontend loads without errors
- [ ] Can read from V3 contracts via Hiro API
- [ ] Can submit transactions to V3 contracts
- [ ] Chainhooks fire when V3 contracts are called
- [ ] Discord notifications work for V3 events
- [ ] All alert types trigger correctly

**Test Scenarios:**
1. Register new user with V3 registry
2. Create alert on V3 alert-manager
3. Trigger alert and verify chainhook fires
4. Check Render logs for webhook processing
5. Verify Discord notification received

### Phase 7: Deployment & Go-Live

**Deployment Order:**
1. Deploy V3 contracts to mainnet
2. Update environment variables
3. Deploy frontend to Vercel
4. Deploy backend to Render
5. Register V3 chainhooks
6. Run end-to-end tests
7. Monitor logs for 24-48 hours

---

## Rollback Plan (if needed)

If V3 deployment has critical issues:
1. Update frontend contract references back to V2
2. Update backend environment variables back to V2
3. Redeploy frontend & backend
4. Re-register V2 chainhooks
5. Delete V3 chainhooks

---

## Key Differences V2 → V3

| Aspect | V2 | V3 |
|--------|-----|-----|
| Contract Names | `stackpulse-v2` | `stackpulse-v3` |
| Addresses | `SP3F...` (V2 contracts) | `SP3F...` (new V3 contracts) |
| Chainhooks | 9 registered for V2 | 9 new for V3 |
| Frontend Refs | 15+ contract references | Updated to V3 |
| Backend Config | V2 addresses | V3 addresses |

---

## Files That Will Change

### Smart Contracts
- [ ] `contracts/stackpulse-v3.clar` (NEW)
- [ ] `contracts/alert-manager-v3.clar` (NEW)
- [ ] `contracts/fee-vault-v3.clar` (NEW)

### Frontend
- [ ] `frontend/src/app/register/page.tsx`
- [ ] `frontend/src/app/dashboard/page.tsx`
- [ ] `frontend/src/components/Pricing.tsx`
- [ ] `frontend/src/components/AlertForm.tsx`
- [ ] `frontend/src/utils/stacks.ts` (if contract ABIs)
- [ ] `.env.local` (NEXT_PUBLIC_DEPLOYER_ADDRESS may change if needed)

### Backend
- [ ] `server/.env`
- [ ] `scripts/register-stackpulse-chainhooks-v3.ts` (NEW)
- [ ] `server/src/services/notifications.ts` (if contract-specific)

### Config
- [ ] `Clarinet.toml` (add V3 contracts if needed)

---

## Rollout Timeline

**Estimated Duration:** 2-3 hours

| Step | Duration | Status |
|------|----------|--------|
| Create V3 contracts | 15 min | ⏳ Ready |
| Deploy to mainnet | 10 min | ⏳ Ready |
| Update frontend | 15 min | ⏳ Ready |
| Update backend | 10 min | ⏳ Ready |
| Register chainhooks | 5 min | ⏳ Ready |
| Testing & validation | 30 min | ⏳ Ready |
| Deployment to Render/Vercel | 10 min | ⏳ Ready |
| Monitoring & verification | 15-30 min | ⏳ Ready |

---

## Success Criteria

✅ All V3 contracts deployed to mainnet  
✅ Frontend loads without errors  
✅ User can register on V3 contracts  
✅ User can create alerts on V3 alert-manager  
✅ Chainhooks fire when V3 contracts are called  
✅ Discord notifications received  
✅ Render logs show successful webhook processing  
✅ No errors in browser console  
✅ No errors in Render application logs  

---

## Notes

- **User Data Migration:** V3 is a new contract version. Existing V2 user data remains on V2. Users will need to register again on V3 if you want to migrate them.
- **Backward Compatibility:** V2 contracts remain active; V3 is additive.
- **Chainhook Changes:** Both V2 and V3 chainhooks can coexist, but we'll switch all activity to V3.
- **API Key:** Hiro Platform API key remains the same.
- **Render Keep-Alive:** Cron ping already configured, will continue working.

---

## Commands to Run (in order)

```bash
# 1. Create V3 contracts (if not already created)
# [Manual: Create stackpulse-v3.clar, alert-manager-v3.clar, fee-vault-v3.clar]

# 2. Deploy V3 contracts
cd /Users/apple/StackPulse
clarinet contract publish stackpulse-v3 --network mainnet
clarinet contract publish alert-manager-v3 --network mainnet
clarinet contract publish fee-vault-v3 --network mainnet

# 3. Update frontend & backend environment
# [Manual: Update contract references in frontend files]
# [Manual: Update server/.env with new contract names]

# 4. Deploy frontend
cd frontend && npm run build && vercel deploy --prod

# 5. Deploy backend
cd ../server && npm run build && git push
# (Render auto-deploys on git push)

# 6. Register V3 chainhooks
HIRO_API_KEY=e447aec3d7d0f623c90051728d2992fd npx ts-node scripts/register-stackpulse-chainhooks-v3.ts

# 7. Run tests
curl https://stackpulse-v3.vercel.app/health
```

---

## Ready for Your "Go Ahead"

This plan is complete and ready to execute. When you give the go-ahead, I will:

1. ✅ Create the 3 V3 smart contract files with all enhancements
2. ✅ Update all 5+ frontend files with V3 contract references
3. ✅ Update backend configuration files
4. ✅ Create V3 chainhook registration script
5. ✅ Deploy to mainnet, Vercel, and Render
6. ✅ Verify all systems are working
7. ✅ Commit changes to git
8. ✅ Provide final status report

**Awaiting your confirmation!** 🚀
