
export const PULSE_CONTRACT_ADDRESS = "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9"

export const PULSE_CONTRACTS = {
    CORE: "stackpulse-v-j4",
    ALERTS: "alert-manager-v-j4",
    VAULT: "fee-vault-v-j4",
    BADGES: "reputation-badges-v-j4"
}

export const PULSE_TIERS = {
    FREE: { id: 0, name: "Free", price: 0 },
    BASIC: { id: 1, name: "Basic", price: 10000 },
    PRO: { id: 2, name: "Pro", price: 50000 },
    PREMIUM: { id: 3, name: "Premium", price: 200000 }
}

/** Polling interval in milliseconds between on-chain feed ticks. */
export const PULSE_TICK_INTERVAL_MS = 5000

export const PULSE_MAX_FEED_SIZE = 100

export const PULSE_API_BASE = "https://api.stackpulse.io"

export const PULSE_WS_URL = "wss://ws.stackpulse.io"

export const PULSE_RECONNECT_DELAY_MS = 3000

export const PULSE_MAX_RETRIES = 5

export const PULSE_STALE_THRESHOLD_MS = 30000

export const PULSE_DEFAULT_NETWORK = "mainnet"

export const PULSE_PRICE_DECIMALS = 6

export const PULSE_STX_DECIMALS = 6

/** Number of micro-STX per 1 STX (10^6). */
export const PULSE_MICROSTX_PER_STX = 1000000

export const PULSE_MIN_TICK_VALUE = 0.001

export const PULSE_CACHE_TTL_MS = 60000

export const PULSE_MAX_CHART_POINTS = 500

export const PULSE_ALERT_COOLDOWN_MS = 10000

export const PULSE_FEED_PAGE_SIZE = 25

export const PULSE_VERSION = "1.0.0"

export const PULSE_STORAGE_KEYS = {
    USER_DATA: "pulse_user_data",
    THEME: "pulse_theme",
    ALERTS: "pulse_recent_alerts",
    SETTINGS: "pulse_settings"
}

/** Average Stacks blocks produced per hour on mainnet. */
export const PULSE_BLOCKS_PER_HOUR = 6

/** Number of Stacks blocks produced per day (~10-min block time) */
export const PULSE_BLOCKS_PER_DAY = 144

/** Minimum cooldown between desktop notification dispatches (ms) */
export const PULSE_MIN_NOTIFICATION_COOLDOWN_MS = 5000

/** Default UI theme for new users */
export const PULSE_DEFAULT_THEME = 'dark'

/** Maximum character length for an alert name */
export const PULSE_MAX_ALERT_NAME_LENGTH = 64

/** Minimum microSTX amount that qualifies as a whale transfer */
export const PULSE_MIN_WHALE_THRESHOLD_MICROSTX = 100_000_000_000

/** Feed polling interval when live WebSocket is unavailable (ms) */
export const PULSE_FEED_REFRESH_MS = 10_000

/** Maximum character length for a webhook URL */
export const PULSE_MAX_WEBHOOK_URL_LENGTH = 512

/** Session inactivity timeout before requiring re-authentication (ms) */
export const PULSE_SESSION_TIMEOUT_MS = 1_800_000

export const PULSE_BLOCKS_PER_DAY = 144
