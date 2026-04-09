"use strict";
/**
 * Patched NostrProvider for Postiz
 *
 * Fixes: https://github.com/gitroomhq/postiz-app/pull/1325
 *
 * Changes from upstream:
 *   1. post() and comment() now convert the hex private key string
 *      to Uint8Array before passing it to finalizeEvent().
 *   2. Supports both hex and nsec (bech32) private key formats.
 *   3. Validates key length (must be exactly 32 bytes / 64 hex chars).
 *   4. Zeroes private key bytes in memory after signing.
 *   5. authenticate() also supports nsec input, converting to hex for storage.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NostrProvider = void 0;
const tslib_1 = require("tslib");
const make_is_1 = require("../../services/make.is");
const dayjs_1 = tslib_1.__importDefault(require("dayjs"));
const social_abstract_1 = require("../social.abstract");
const nostr_tools_1 = require("nostr-tools");
const ws_1 = tslib_1.__importDefault(require("ws"));
const auth_service_1 = require("../../../../helpers/src/auth/auth.service");

let nip19;
try {
    nip19 = require("nostr-tools/nip19");
} catch {
    nip19 = null;
}

global.WebSocket = ws_1.default;

const list = [
    "wss://nos.lol",
    "wss://relay.damus.io",
    "wss://relay.snort.social",
    "wss://temp.iris.to",
    "wss://vault.iris.to",
];

const pool = new nostr_tools_1.SimplePool();

// --- Secure key helpers ---

const HEX_RE = /^[0-9a-fA-F]{64}$/;

/**
 * Decode a private key string (hex or nsec bech32) into a 32-byte Uint8Array.
 * Throws on invalid input.
 */
function decodePrivateKey(raw) {
    if (typeof raw !== "string" || raw.length === 0) {
        throw new Error("Private key must be a non-empty string");
    }

    const trimmed = raw.trim();

    // Handle nsec bech32 format
    if (trimmed.startsWith("nsec1")) {
        if (!nip19) {
            throw new Error("nip19 module not available for nsec decoding");
        }
        const decoded = nip19.decode(trimmed);
        if (decoded.type !== "nsec") {
            throw new Error("Expected nsec key type, got: " + decoded.type);
        }
        const data = decoded.data;
        // nip19.decode returns Uint8Array for nsec
        if (data instanceof Uint8Array && data.length === 32) {
            return data;
        }
        throw new Error("Decoded nsec key is not 32 bytes");
    }

    // Handle hex format
    if (!HEX_RE.test(trimmed)) {
        throw new Error(
            "Private key must be 64 hex characters or a valid nsec bech32 string"
        );
    }

    const bytes = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
        bytes[i] = parseInt(trimmed.substring(i * 2, i * 2 + 2), 16);
    }
    return bytes;
}

/**
 * Convert a private key (hex or nsec) to its hex representation for storage.
 * This normalises nsec keys to hex before they are persisted in the JWT.
 */
function normaliseToHex(raw) {
    const trimmed = raw.trim();
    if (HEX_RE.test(trimmed)) {
        return trimmed.toLowerCase();
    }
    if (trimmed.startsWith("nsec1")) {
        const bytes = decodePrivateKey(trimmed);
        const hex = Array.from(bytes, (b) =>
            b.toString(16).padStart(2, "0")
        ).join("");
        zeroBytes(bytes);
        return hex;
    }
    throw new Error(
        "Private key must be 64 hex characters or a valid nsec bech32 string"
    );
}

/**
 * Overwrite a Uint8Array with zeroes to reduce key exposure in memory.
 * Not a guarantee (GC, JIT copies), but limits the window.
 */
function zeroBytes(arr) {
    if (arr && arr.fill) {
        arr.fill(0);
    }
}

// --- Provider ---

class NostrProvider extends social_abstract_1.SocialAbstract {
    constructor() {
        super(...arguments);
        this.maxConcurrentJob = 5;
        this.identifier = "nostr";
        this.name = "Nostr";
        this.isBetweenSteps = false;
        this.scopes = [];
        this.editor = "normal";
        this.toolTip =
            "Provide your Nostr private key in hex (64 characters) or nsec format";
    }

    maxLength() {
        return 100000;
    }

    async customFields() {
        return [
            {
                key: "password",
                label: "Nostr private key",
                validation: `/^.{3,}$/`,
                type: "password",
            },
        ];
    }

    async refreshToken(refresh_token) {
        return {
            refreshToken: "",
            expiresIn: 0,
            accessToken: "",
            id: "",
            name: "",
            picture: "",
            username: "",
        };
    }

    async generateAuthUrl() {
        const state = (0, make_is_1.makeId)(17);
        return {
            url: state,
            codeVerifier: (0, make_is_1.makeId)(10),
            state,
        };
    }

    async findRelayInformation(pubkey) {
        const evt = await pool.get(list, {
            kinds: [0],
            authors: [pubkey],
            limit: 1,
        });
        if (!evt) return {};
        let content = {};
        try {
            content = JSON.parse(evt.content || "{}");
        } catch {
            return {};
        }
        if (content.name || content.displayName || content.display_name) {
            return content;
        }
        return {};
    }

    async publish(pubkey, event) {
        let id = "";
        for (const relay of list) {
            try {
                const relayInstance = await nostr_tools_1.Relay.connect(relay);
                const value = new Promise((resolve) => {
                    relayInstance.subscribe(
                        [{ kinds: [1], authors: [pubkey] }],
                        {
                            eoseTimeout: 6000,
                            onevent: (event) => {
                                resolve(event);
                            },
                            oneose: () => {
                                resolve({});
                            },
                            onclose: () => {
                                resolve({});
                            },
                        }
                    );
                });
                await relayInstance.publish(event);
                const all = await value;
                relayInstance.close();
                id = id || all?.id;
            } catch (err) {
                /* relay failure, try next */
            }
        }
        return id;
    }

    async authenticate(params) {
        let keyBytes;
        try {
            const body = JSON.parse(
                Buffer.from(params.code, "base64").toString()
            );
            const hexKey = normaliseToHex(body.password);
            keyBytes = decodePrivateKey(hexKey);
            const pubkey = (0, nostr_tools_1.getPublicKey)(keyBytes);
            zeroBytes(keyBytes);
            keyBytes = null;

            const user = await this.findRelayInformation(pubkey);

            return {
                id: pubkey,
                name:
                    user.display_name ||
                    user.displayName ||
                    user.name ||
                    "No Name",
                accessToken: auth_service_1.AuthService.signJWT({
                    password: hexKey,
                }),
                refreshToken: "",
                expiresIn:
                    (0, dayjs_1.default)().add(200, "year").unix() -
                    (0, dayjs_1.default)().unix(),
                picture: user?.picture || "",
                username: user.name || "nousername",
            };
        } catch (e) {
            if (keyBytes) zeroBytes(keyBytes);
            console.log(e);
            return "Invalid credentials";
        }
    }

    buildContent(post) {
        const mediaContent =
            post.media?.map((m) => m.path).join("\n\n") || "";
        return mediaContent
            ? `${post.message}\n\n${mediaContent}`
            : post.message;
    }

    async post(id, accessToken, postDetails) {
        const { password } = auth_service_1.AuthService.verifyJWT(accessToken);
        const keyBytes = decodePrivateKey(password);

        try {
            const [firstPost] = postDetails;
            const textEvent = (0, nostr_tools_1.finalizeEvent)(
                {
                    kind: 1,
                    content: this.buildContent(firstPost),
                    tags: [],
                    created_at: Math.floor(Date.now() / 1000),
                },
                keyBytes
            );
            const eventId = await this.publish(id, textEvent);
            return [
                {
                    id: firstPost.id,
                    postId: String(eventId),
                    releaseURL: `https://primal.net/e/${eventId}`,
                    status: "completed",
                },
            ];
        } finally {
            zeroBytes(keyBytes);
        }
    }

    async comment(
        id,
        postId,
        lastCommentId,
        accessToken,
        postDetails,
        integration
    ) {
        const { password } = auth_service_1.AuthService.verifyJWT(accessToken);
        const keyBytes = decodePrivateKey(password);

        try {
            const [commentPost] = postDetails;
            const replyToId = lastCommentId || postId;
            const textEvent = (0, nostr_tools_1.finalizeEvent)(
                {
                    kind: 1,
                    content: this.buildContent(commentPost),
                    tags: [
                        ["e", replyToId, "", "reply"],
                        ["p", id],
                    ],
                    created_at: Math.floor(Date.now() / 1000),
                },
                keyBytes
            );
            const eventId = await this.publish(id, textEvent);
            return [
                {
                    id: commentPost.id,
                    postId: String(eventId),
                    releaseURL: `https://primal.net/e/${eventId}`,
                    status: "completed",
                },
            ];
        } finally {
            zeroBytes(keyBytes);
        }
    }
}
exports.NostrProvider = NostrProvider;
