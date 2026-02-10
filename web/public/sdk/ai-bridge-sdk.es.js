class $t {
  constructor(t) {
    this.iframe = null, this.config = t;
  }
  /**
   * 创建并返回 iframe 元素
   */
  createIframe() {
    return this.iframe = document.createElement("iframe"), this.iframe.src = this.buildIframeUrl(), this.iframe.style.border = "none", this.iframe.style.width = "100%", this.iframe.style.height = "100%", this.iframe.style.overflow = "hidden", this.config.containerStyle && Object.assign(this.iframe.style, this.config.containerStyle), this.iframe.setAttribute("sandbox", "allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"), this.iframe;
  }
  /**
   * 构建 iframe URL(包含上下文参数)
   */
  buildIframeUrl() {
    const t = new URL(this.config.url);
    return this.config.context && (this.config.context.sessionId && t.searchParams.set("sessionId", this.config.context.sessionId), this.config.context.theme && t.searchParams.set("theme", this.config.context.theme), this.config.context.locale && t.searchParams.set("locale", this.config.context.locale)), t.searchParams.set("embed", "true"), t.toString();
  }
  /**
   * 获取 iframe 的 contentWindow
   */
  getContentWindow() {
    return this.iframe?.contentWindow ?? null;
  }
  /**
   * 等待 iframe 加载完成
   */
  async waitForLoad() {
    if (!this.iframe)
      throw new Error("Iframe not created");
    return new Promise((t, n) => {
      const r = setTimeout(() => {
        n(new Error("Iframe load timeout"));
      }, 1e4);
      this.iframe.addEventListener("load", () => {
        clearTimeout(r), t();
      }, { once: !0 });
    });
  }
  /**
   * 销毁 iframe
   */
  destroy() {
    this.iframe && (this.iframe.remove(), this.iframe = null);
  }
  /**
   * 获取 iframe 元素(用于挂载到 DOM)
   */
  getIframe() {
    return this.iframe;
  }
}
function u(e, t, n) {
  function r(c, a) {
    if (c._zod || Object.defineProperty(c, "_zod", {
      value: {
        def: a,
        constr: s,
        traits: /* @__PURE__ */ new Set()
      },
      enumerable: !1
    }), c._zod.traits.has(e))
      return;
    c._zod.traits.add(e), t(c, a);
    const l = s.prototype, f = Object.keys(l);
    for (let d = 0; d < f.length; d++) {
      const p = f[d];
      p in c || (c[p] = l[p].bind(c));
    }
  }
  const o = n?.Parent ?? Object;
  class i extends o {
  }
  Object.defineProperty(i, "name", { value: e });
  function s(c) {
    var a;
    const l = n?.Parent ? new i() : this;
    r(l, c), (a = l._zod).deferred ?? (a.deferred = []);
    for (const f of l._zod.deferred)
      f();
    return l;
  }
  return Object.defineProperty(s, "init", { value: r }), Object.defineProperty(s, Symbol.hasInstance, {
    value: (c) => n?.Parent && c instanceof n.Parent ? !0 : c?._zod?.traits?.has(e)
  }), Object.defineProperty(s, "name", { value: e }), s;
}
class F extends Error {
  constructor() {
    super("Encountered Promise during synchronous parse. Use .parseAsync() instead.");
  }
}
class Fe extends Error {
  constructor(t) {
    super(`Encountered unidirectional transform during encode: ${t}`), this.name = "ZodEncodeError";
  }
}
const Le = {};
function P(e) {
  return Le;
}
function Je(e) {
  const t = Object.values(e).filter((r) => typeof r == "number");
  return Object.entries(e).filter(([r, o]) => t.indexOf(+r) === -1).map(([r, o]) => o);
}
function ue(e, t) {
  return typeof t == "bigint" ? t.toString() : t;
}
function ne(e) {
  return {
    get value() {
      {
        const t = e();
        return Object.defineProperty(this, "value", { value: t }), t;
      }
    }
  };
}
function he(e) {
  return e == null;
}
function pe(e) {
  const t = e.startsWith("^") ? 1 : 0, n = e.endsWith("$") ? e.length - 1 : e.length;
  return e.slice(t, n);
}
function Zt(e, t) {
  const n = (e.toString().split(".")[1] || "").length, r = t.toString();
  let o = (r.split(".")[1] || "").length;
  if (o === 0 && /\d?e-\d?/.test(r)) {
    const a = r.match(/\d?e-(\d?)/);
    a?.[1] && (o = Number.parseInt(a[1]));
  }
  const i = n > o ? n : o, s = Number.parseInt(e.toFixed(i).replace(".", "")), c = Number.parseInt(t.toFixed(i).replace(".", ""));
  return s % c / 10 ** i;
}
const ye = /* @__PURE__ */ Symbol("evaluating");
function g(e, t, n) {
  let r;
  Object.defineProperty(e, t, {
    get() {
      if (r !== ye)
        return r === void 0 && (r = ye, r = n()), r;
    },
    set(o) {
      Object.defineProperty(e, t, {
        value: o
        // configurable: true,
      });
    },
    configurable: !0
  });
}
function M(e, t, n) {
  Object.defineProperty(e, t, {
    value: n,
    writable: !0,
    enumerable: !0,
    configurable: !0
  });
}
function R(...e) {
  const t = {};
  for (const n of e) {
    const r = Object.getOwnPropertyDescriptors(n);
    Object.assign(t, r);
  }
  return Object.defineProperties({}, t);
}
function be(e) {
  return JSON.stringify(e);
}
function St(e) {
  return e.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}
const He = "captureStackTrace" in Error ? Error.captureStackTrace : (...e) => {
};
function W(e) {
  return typeof e == "object" && e !== null && !Array.isArray(e);
}
const Et = ne(() => {
  if (typeof navigator < "u" && navigator?.userAgent?.includes("Cloudflare"))
    return !1;
  try {
    const e = Function;
    return new e(""), !0;
  } catch {
    return !1;
  }
});
function L(e) {
  if (W(e) === !1)
    return !1;
  const t = e.constructor;
  if (t === void 0 || typeof t != "function")
    return !0;
  const n = t.prototype;
  return !(W(n) === !1 || Object.prototype.hasOwnProperty.call(n, "isPrototypeOf") === !1);
}
function Ve(e) {
  return L(e) ? { ...e } : Array.isArray(e) ? [...e] : e;
}
const Ot = /* @__PURE__ */ new Set(["string", "number", "symbol"]);
function J(e) {
  return e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function C(e, t, n) {
  const r = new e._zod.constr(t ?? e._zod.def);
  return (!t || n?.parent) && (r._zod.parent = e), r;
}
function h(e) {
  const t = e;
  if (!t)
    return {};
  if (typeof t == "string")
    return { error: () => t };
  if (t?.message !== void 0) {
    if (t?.error !== void 0)
      throw new Error("Cannot specify both `message` and `error` params");
    t.error = t.message;
  }
  return delete t.message, typeof t.error == "string" ? { ...t, error: () => t.error } : t;
}
function It(e) {
  return Object.keys(e).filter((t) => e[t]._zod.optin === "optional" && e[t]._zod.optout === "optional");
}
const Nt = {
  safeint: [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
  int32: [-2147483648, 2147483647],
  uint32: [0, 4294967295],
  float32: [-34028234663852886e22, 34028234663852886e22],
  float64: [-Number.MAX_VALUE, Number.MAX_VALUE]
};
function Tt(e, t) {
  const n = e._zod.def, r = n.checks;
  if (r && r.length > 0)
    throw new Error(".pick() cannot be used on object schemas containing refinements");
  const i = R(e._zod.def, {
    get shape() {
      const s = {};
      for (const c in t) {
        if (!(c in n.shape))
          throw new Error(`Unrecognized key: "${c}"`);
        t[c] && (s[c] = n.shape[c]);
      }
      return M(this, "shape", s), s;
    },
    checks: []
  });
  return C(e, i);
}
function At(e, t) {
  const n = e._zod.def, r = n.checks;
  if (r && r.length > 0)
    throw new Error(".omit() cannot be used on object schemas containing refinements");
  const i = R(e._zod.def, {
    get shape() {
      const s = { ...e._zod.def.shape };
      for (const c in t) {
        if (!(c in n.shape))
          throw new Error(`Unrecognized key: "${c}"`);
        t[c] && delete s[c];
      }
      return M(this, "shape", s), s;
    },
    checks: []
  });
  return C(e, i);
}
function Pt(e, t) {
  if (!L(t))
    throw new Error("Invalid input to extend: expected a plain object");
  const n = e._zod.def.checks;
  if (n && n.length > 0) {
    const i = e._zod.def.shape;
    for (const s in t)
      if (Object.getOwnPropertyDescriptor(i, s) !== void 0)
        throw new Error("Cannot overwrite keys on object schemas containing refinements. Use `.safeExtend()` instead.");
  }
  const o = R(e._zod.def, {
    get shape() {
      const i = { ...e._zod.def.shape, ...t };
      return M(this, "shape", i), i;
    }
  });
  return C(e, o);
}
function Dt(e, t) {
  if (!L(t))
    throw new Error("Invalid input to safeExtend: expected a plain object");
  const n = R(e._zod.def, {
    get shape() {
      const r = { ...e._zod.def.shape, ...t };
      return M(this, "shape", r), r;
    }
  });
  return C(e, n);
}
function Rt(e, t) {
  const n = R(e._zod.def, {
    get shape() {
      const r = { ...e._zod.def.shape, ...t._zod.def.shape };
      return M(this, "shape", r), r;
    },
    get catchall() {
      return t._zod.def.catchall;
    },
    checks: []
    // delete existing checks
  });
  return C(e, n);
}
function Ct(e, t, n) {
  const o = t._zod.def.checks;
  if (o && o.length > 0)
    throw new Error(".partial() cannot be used on object schemas containing refinements");
  const s = R(t._zod.def, {
    get shape() {
      const c = t._zod.def.shape, a = { ...c };
      if (n)
        for (const l in n) {
          if (!(l in c))
            throw new Error(`Unrecognized key: "${l}"`);
          n[l] && (a[l] = e ? new e({
            type: "optional",
            innerType: c[l]
          }) : c[l]);
        }
      else
        for (const l in c)
          a[l] = e ? new e({
            type: "optional",
            innerType: c[l]
          }) : c[l];
      return M(this, "shape", a), a;
    },
    checks: []
  });
  return C(t, s);
}
function jt(e, t, n) {
  const r = R(t._zod.def, {
    get shape() {
      const o = t._zod.def.shape, i = { ...o };
      if (n)
        for (const s in n) {
          if (!(s in i))
            throw new Error(`Unrecognized key: "${s}"`);
          n[s] && (i[s] = new e({
            type: "nonoptional",
            innerType: o[s]
          }));
        }
      else
        for (const s in o)
          i[s] = new e({
            type: "nonoptional",
            innerType: o[s]
          });
      return M(this, "shape", i), i;
    }
  });
  return C(t, r);
}
function x(e, t = 0) {
  if (e.aborted === !0)
    return !0;
  for (let n = t; n < e.issues.length; n++)
    if (e.issues[n]?.continue !== !0)
      return !0;
  return !1;
}
function U(e, t) {
  return t.map((n) => {
    var r;
    return (r = n).path ?? (r.path = []), n.path.unshift(e), n;
  });
}
function G(e) {
  return typeof e == "string" ? e : e?.message;
}
function D(e, t, n) {
  const r = { ...e, path: e.path ?? [] };
  if (!e.message) {
    const o = G(e.inst?._zod.def?.error?.(e)) ?? G(t?.error?.(e)) ?? G(n.customError?.(e)) ?? G(n.localeError?.(e)) ?? "Invalid input";
    r.message = o;
  }
  return delete r.inst, delete r.continue, t?.reportInput || delete r.input, r;
}
function me(e) {
  return Array.isArray(e) ? "array" : typeof e == "string" ? "string" : "unknown";
}
function B(...e) {
  const [t, n, r] = e;
  return typeof t == "string" ? {
    message: t,
    code: "custom",
    input: n,
    inst: r
  } : { ...t };
}
const We = (e, t) => {
  e.name = "$ZodError", Object.defineProperty(e, "_zod", {
    value: e._zod,
    enumerable: !1
  }), Object.defineProperty(e, "issues", {
    value: t,
    enumerable: !1
  }), e.message = JSON.stringify(t, ue, 2), Object.defineProperty(e, "toString", {
    value: () => e.message,
    enumerable: !1
  });
}, Be = u("$ZodError", We), Ke = u("$ZodError", We, { Parent: Error });
function Mt(e, t = (n) => n.message) {
  const n = {}, r = [];
  for (const o of e.issues)
    o.path.length > 0 ? (n[o.path[0]] = n[o.path[0]] || [], n[o.path[0]].push(t(o))) : r.push(t(o));
  return { formErrors: r, fieldErrors: n };
}
function xt(e, t = (n) => n.message) {
  const n = { _errors: [] }, r = (o) => {
    for (const i of o.issues)
      if (i.code === "invalid_union" && i.errors.length)
        i.errors.map((s) => r({ issues: s }));
      else if (i.code === "invalid_key")
        r({ issues: i.issues });
      else if (i.code === "invalid_element")
        r({ issues: i.issues });
      else if (i.path.length === 0)
        n._errors.push(t(i));
      else {
        let s = n, c = 0;
        for (; c < i.path.length; ) {
          const a = i.path[c];
          c === i.path.length - 1 ? (s[a] = s[a] || { _errors: [] }, s[a]._errors.push(t(i))) : s[a] = s[a] || { _errors: [] }, s = s[a], c++;
        }
      }
  };
  return r(e), n;
}
const ge = (e) => (t, n, r, o) => {
  const i = r ? Object.assign(r, { async: !1 }) : { async: !1 }, s = t._zod.run({ value: n, issues: [] }, i);
  if (s instanceof Promise)
    throw new F();
  if (s.issues.length) {
    const c = new (o?.Err ?? e)(s.issues.map((a) => D(a, i, P())));
    throw He(c, o?.callee), c;
  }
  return s.value;
}, _e = (e) => async (t, n, r, o) => {
  const i = r ? Object.assign(r, { async: !0 }) : { async: !0 };
  let s = t._zod.run({ value: n, issues: [] }, i);
  if (s instanceof Promise && (s = await s), s.issues.length) {
    const c = new (o?.Err ?? e)(s.issues.map((a) => D(a, i, P())));
    throw He(c, o?.callee), c;
  }
  return s.value;
}, re = (e) => (t, n, r) => {
  const o = r ? { ...r, async: !1 } : { async: !1 }, i = t._zod.run({ value: n, issues: [] }, o);
  if (i instanceof Promise)
    throw new F();
  return i.issues.length ? {
    success: !1,
    error: new (e ?? Be)(i.issues.map((s) => D(s, o, P())))
  } : { success: !0, data: i.value };
}, Ut = /* @__PURE__ */ re(Ke), oe = (e) => async (t, n, r) => {
  const o = r ? Object.assign(r, { async: !0 }) : { async: !0 };
  let i = t._zod.run({ value: n, issues: [] }, o);
  return i instanceof Promise && (i = await i), i.issues.length ? {
    success: !1,
    error: new e(i.issues.map((s) => D(s, o, P())))
  } : { success: !0, data: i.value };
}, Ft = /* @__PURE__ */ oe(Ke), Lt = (e) => (t, n, r) => {
  const o = r ? Object.assign(r, { direction: "backward" }) : { direction: "backward" };
  return ge(e)(t, n, o);
}, Jt = (e) => (t, n, r) => ge(e)(t, n, r), Ht = (e) => async (t, n, r) => {
  const o = r ? Object.assign(r, { direction: "backward" }) : { direction: "backward" };
  return _e(e)(t, n, o);
}, Vt = (e) => async (t, n, r) => _e(e)(t, n, r), Wt = (e) => (t, n, r) => {
  const o = r ? Object.assign(r, { direction: "backward" }) : { direction: "backward" };
  return re(e)(t, n, o);
}, Bt = (e) => (t, n, r) => re(e)(t, n, r), Kt = (e) => async (t, n, r) => {
  const o = r ? Object.assign(r, { direction: "backward" }) : { direction: "backward" };
  return oe(e)(t, n, o);
}, Gt = (e) => async (t, n, r) => oe(e)(t, n, r), Yt = /^[cC][^\s-]{8,}$/, qt = /^[0-9a-z]+$/, Qt = /^[0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{26}$/, Xt = /^[0-9a-vA-V]{20}$/, en = /^[A-Za-z0-9]{27}$/, tn = /^[a-zA-Z0-9_-]{21}$/, nn = /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/, rn = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/, we = (e) => e ? new RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${e}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`) : /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/, on = /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/, sn = "^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$";
function cn() {
  return new RegExp(sn, "u");
}
const an = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/, un = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/, ln = /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/, fn = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::|([0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:?){0,6})\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/, dn = /^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/, Ge = /^[A-Za-z0-9_-]*$/, hn = /^\+[1-9]\d{6,14}$/, Ye = "(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))", pn = /* @__PURE__ */ new RegExp(`^${Ye}$`);
function qe(e) {
  const t = "(?:[01]\\d|2[0-3]):[0-5]\\d";
  return typeof e.precision == "number" ? e.precision === -1 ? `${t}` : e.precision === 0 ? `${t}:[0-5]\\d` : `${t}:[0-5]\\d\\.\\d{${e.precision}}` : `${t}(?::[0-5]\\d(?:\\.\\d+)?)?`;
}
function mn(e) {
  return new RegExp(`^${qe(e)}$`);
}
function gn(e) {
  const t = qe({ precision: e.precision }), n = ["Z"];
  e.local && n.push(""), e.offset && n.push("([+-](?:[01]\\d|2[0-3]):[0-5]\\d)");
  const r = `${t}(?:${n.join("|")})`;
  return new RegExp(`^${Ye}T(?:${r})$`);
}
const _n = (e) => {
  const t = e ? `[\\s\\S]{${e?.minimum ?? 0},${e?.maximum ?? ""}}` : "[\\s\\S]*";
  return new RegExp(`^${t}$`);
}, vn = /^-?\d+$/, Qe = /^-?\d+(?:\.\d+)?$/, yn = /^(?:true|false)$/i, bn = /^[^A-Z]*$/, wn = /^[^a-z]*$/, S = /* @__PURE__ */ u("$ZodCheck", (e, t) => {
  var n;
  e._zod ?? (e._zod = {}), e._zod.def = t, (n = e._zod).onattach ?? (n.onattach = []);
}), Xe = {
  number: "number",
  bigint: "bigint",
  object: "date"
}, et = /* @__PURE__ */ u("$ZodCheckLessThan", (e, t) => {
  S.init(e, t);
  const n = Xe[typeof t.value];
  e._zod.onattach.push((r) => {
    const o = r._zod.bag, i = (t.inclusive ? o.maximum : o.exclusiveMaximum) ?? Number.POSITIVE_INFINITY;
    t.value < i && (t.inclusive ? o.maximum = t.value : o.exclusiveMaximum = t.value);
  }), e._zod.check = (r) => {
    (t.inclusive ? r.value <= t.value : r.value < t.value) || r.issues.push({
      origin: n,
      code: "too_big",
      maximum: typeof t.value == "object" ? t.value.getTime() : t.value,
      input: r.value,
      inclusive: t.inclusive,
      inst: e,
      continue: !t.abort
    });
  };
}), tt = /* @__PURE__ */ u("$ZodCheckGreaterThan", (e, t) => {
  S.init(e, t);
  const n = Xe[typeof t.value];
  e._zod.onattach.push((r) => {
    const o = r._zod.bag, i = (t.inclusive ? o.minimum : o.exclusiveMinimum) ?? Number.NEGATIVE_INFINITY;
    t.value > i && (t.inclusive ? o.minimum = t.value : o.exclusiveMinimum = t.value);
  }), e._zod.check = (r) => {
    (t.inclusive ? r.value >= t.value : r.value > t.value) || r.issues.push({
      origin: n,
      code: "too_small",
      minimum: typeof t.value == "object" ? t.value.getTime() : t.value,
      input: r.value,
      inclusive: t.inclusive,
      inst: e,
      continue: !t.abort
    });
  };
}), zn = /* @__PURE__ */ u("$ZodCheckMultipleOf", (e, t) => {
  S.init(e, t), e._zod.onattach.push((n) => {
    var r;
    (r = n._zod.bag).multipleOf ?? (r.multipleOf = t.value);
  }), e._zod.check = (n) => {
    if (typeof n.value != typeof t.value)
      throw new Error("Cannot mix number and bigint in multiple_of check.");
    (typeof n.value == "bigint" ? n.value % t.value === BigInt(0) : Zt(n.value, t.value) === 0) || n.issues.push({
      origin: typeof n.value,
      code: "not_multiple_of",
      divisor: t.value,
      input: n.value,
      inst: e,
      continue: !t.abort
    });
  };
}), kn = /* @__PURE__ */ u("$ZodCheckNumberFormat", (e, t) => {
  S.init(e, t), t.format = t.format || "float64";
  const n = t.format?.includes("int"), r = n ? "int" : "number", [o, i] = Nt[t.format];
  e._zod.onattach.push((s) => {
    const c = s._zod.bag;
    c.format = t.format, c.minimum = o, c.maximum = i, n && (c.pattern = vn);
  }), e._zod.check = (s) => {
    const c = s.value;
    if (n) {
      if (!Number.isInteger(c)) {
        s.issues.push({
          expected: r,
          format: t.format,
          code: "invalid_type",
          continue: !1,
          input: c,
          inst: e
        });
        return;
      }
      if (!Number.isSafeInteger(c)) {
        c > 0 ? s.issues.push({
          input: c,
          code: "too_big",
          maximum: Number.MAX_SAFE_INTEGER,
          note: "Integers must be within the safe integer range.",
          inst: e,
          origin: r,
          inclusive: !0,
          continue: !t.abort
        }) : s.issues.push({
          input: c,
          code: "too_small",
          minimum: Number.MIN_SAFE_INTEGER,
          note: "Integers must be within the safe integer range.",
          inst: e,
          origin: r,
          inclusive: !0,
          continue: !t.abort
        });
        return;
      }
    }
    c < o && s.issues.push({
      origin: "number",
      input: c,
      code: "too_small",
      minimum: o,
      inclusive: !0,
      inst: e,
      continue: !t.abort
    }), c > i && s.issues.push({
      origin: "number",
      input: c,
      code: "too_big",
      maximum: i,
      inclusive: !0,
      inst: e,
      continue: !t.abort
    });
  };
}), $n = /* @__PURE__ */ u("$ZodCheckMaxLength", (e, t) => {
  var n;
  S.init(e, t), (n = e._zod.def).when ?? (n.when = (r) => {
    const o = r.value;
    return !he(o) && o.length !== void 0;
  }), e._zod.onattach.push((r) => {
    const o = r._zod.bag.maximum ?? Number.POSITIVE_INFINITY;
    t.maximum < o && (r._zod.bag.maximum = t.maximum);
  }), e._zod.check = (r) => {
    const o = r.value;
    if (o.length <= t.maximum)
      return;
    const s = me(o);
    r.issues.push({
      origin: s,
      code: "too_big",
      maximum: t.maximum,
      inclusive: !0,
      input: o,
      inst: e,
      continue: !t.abort
    });
  };
}), Zn = /* @__PURE__ */ u("$ZodCheckMinLength", (e, t) => {
  var n;
  S.init(e, t), (n = e._zod.def).when ?? (n.when = (r) => {
    const o = r.value;
    return !he(o) && o.length !== void 0;
  }), e._zod.onattach.push((r) => {
    const o = r._zod.bag.minimum ?? Number.NEGATIVE_INFINITY;
    t.minimum > o && (r._zod.bag.minimum = t.minimum);
  }), e._zod.check = (r) => {
    const o = r.value;
    if (o.length >= t.minimum)
      return;
    const s = me(o);
    r.issues.push({
      origin: s,
      code: "too_small",
      minimum: t.minimum,
      inclusive: !0,
      input: o,
      inst: e,
      continue: !t.abort
    });
  };
}), Sn = /* @__PURE__ */ u("$ZodCheckLengthEquals", (e, t) => {
  var n;
  S.init(e, t), (n = e._zod.def).when ?? (n.when = (r) => {
    const o = r.value;
    return !he(o) && o.length !== void 0;
  }), e._zod.onattach.push((r) => {
    const o = r._zod.bag;
    o.minimum = t.length, o.maximum = t.length, o.length = t.length;
  }), e._zod.check = (r) => {
    const o = r.value, i = o.length;
    if (i === t.length)
      return;
    const s = me(o), c = i > t.length;
    r.issues.push({
      origin: s,
      ...c ? { code: "too_big", maximum: t.length } : { code: "too_small", minimum: t.length },
      inclusive: !0,
      exact: !0,
      input: r.value,
      inst: e,
      continue: !t.abort
    });
  };
}), se = /* @__PURE__ */ u("$ZodCheckStringFormat", (e, t) => {
  var n, r;
  S.init(e, t), e._zod.onattach.push((o) => {
    const i = o._zod.bag;
    i.format = t.format, t.pattern && (i.patterns ?? (i.patterns = /* @__PURE__ */ new Set()), i.patterns.add(t.pattern));
  }), t.pattern ? (n = e._zod).check ?? (n.check = (o) => {
    t.pattern.lastIndex = 0, !t.pattern.test(o.value) && o.issues.push({
      origin: "string",
      code: "invalid_format",
      format: t.format,
      input: o.value,
      ...t.pattern ? { pattern: t.pattern.toString() } : {},
      inst: e,
      continue: !t.abort
    });
  }) : (r = e._zod).check ?? (r.check = () => {
  });
}), En = /* @__PURE__ */ u("$ZodCheckRegex", (e, t) => {
  se.init(e, t), e._zod.check = (n) => {
    t.pattern.lastIndex = 0, !t.pattern.test(n.value) && n.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "regex",
      input: n.value,
      pattern: t.pattern.toString(),
      inst: e,
      continue: !t.abort
    });
  };
}), On = /* @__PURE__ */ u("$ZodCheckLowerCase", (e, t) => {
  t.pattern ?? (t.pattern = bn), se.init(e, t);
}), In = /* @__PURE__ */ u("$ZodCheckUpperCase", (e, t) => {
  t.pattern ?? (t.pattern = wn), se.init(e, t);
}), Nn = /* @__PURE__ */ u("$ZodCheckIncludes", (e, t) => {
  S.init(e, t);
  const n = J(t.includes), r = new RegExp(typeof t.position == "number" ? `^.{${t.position}}${n}` : n);
  t.pattern = r, e._zod.onattach.push((o) => {
    const i = o._zod.bag;
    i.patterns ?? (i.patterns = /* @__PURE__ */ new Set()), i.patterns.add(r);
  }), e._zod.check = (o) => {
    o.value.includes(t.includes, t.position) || o.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "includes",
      includes: t.includes,
      input: o.value,
      inst: e,
      continue: !t.abort
    });
  };
}), Tn = /* @__PURE__ */ u("$ZodCheckStartsWith", (e, t) => {
  S.init(e, t);
  const n = new RegExp(`^${J(t.prefix)}.*`);
  t.pattern ?? (t.pattern = n), e._zod.onattach.push((r) => {
    const o = r._zod.bag;
    o.patterns ?? (o.patterns = /* @__PURE__ */ new Set()), o.patterns.add(n);
  }), e._zod.check = (r) => {
    r.value.startsWith(t.prefix) || r.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "starts_with",
      prefix: t.prefix,
      input: r.value,
      inst: e,
      continue: !t.abort
    });
  };
}), An = /* @__PURE__ */ u("$ZodCheckEndsWith", (e, t) => {
  S.init(e, t);
  const n = new RegExp(`.*${J(t.suffix)}$`);
  t.pattern ?? (t.pattern = n), e._zod.onattach.push((r) => {
    const o = r._zod.bag;
    o.patterns ?? (o.patterns = /* @__PURE__ */ new Set()), o.patterns.add(n);
  }), e._zod.check = (r) => {
    r.value.endsWith(t.suffix) || r.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "ends_with",
      suffix: t.suffix,
      input: r.value,
      inst: e,
      continue: !t.abort
    });
  };
}), Pn = /* @__PURE__ */ u("$ZodCheckOverwrite", (e, t) => {
  S.init(e, t), e._zod.check = (n) => {
    n.value = t.tx(n.value);
  };
});
class Dn {
  constructor(t = []) {
    this.content = [], this.indent = 0, this && (this.args = t);
  }
  indented(t) {
    this.indent += 1, t(this), this.indent -= 1;
  }
  write(t) {
    if (typeof t == "function") {
      t(this, { execution: "sync" }), t(this, { execution: "async" });
      return;
    }
    const r = t.split(`
`).filter((s) => s), o = Math.min(...r.map((s) => s.length - s.trimStart().length)), i = r.map((s) => s.slice(o)).map((s) => " ".repeat(this.indent * 2) + s);
    for (const s of i)
      this.content.push(s);
  }
  compile() {
    const t = Function, n = this?.args, o = [...(this?.content ?? [""]).map((i) => `  ${i}`)];
    return new t(...n, o.join(`
`));
  }
}
const Rn = {
  major: 4,
  minor: 3,
  patch: 6
}, _ = /* @__PURE__ */ u("$ZodType", (e, t) => {
  var n;
  e ?? (e = {}), e._zod.def = t, e._zod.bag = e._zod.bag || {}, e._zod.version = Rn;
  const r = [...e._zod.def.checks ?? []];
  e._zod.traits.has("$ZodCheck") && r.unshift(e);
  for (const o of r)
    for (const i of o._zod.onattach)
      i(e);
  if (r.length === 0)
    (n = e._zod).deferred ?? (n.deferred = []), e._zod.deferred?.push(() => {
      e._zod.run = e._zod.parse;
    });
  else {
    const o = (s, c, a) => {
      let l = x(s), f;
      for (const d of c) {
        if (d._zod.def.when) {
          if (!d._zod.def.when(s))
            continue;
        } else if (l)
          continue;
        const p = s.issues.length, m = d._zod.check(s);
        if (m instanceof Promise && a?.async === !1)
          throw new F();
        if (f || m instanceof Promise)
          f = (f ?? Promise.resolve()).then(async () => {
            await m, s.issues.length !== p && (l || (l = x(s, p)));
          });
        else {
          if (s.issues.length === p)
            continue;
          l || (l = x(s, p));
        }
      }
      return f ? f.then(() => s) : s;
    }, i = (s, c, a) => {
      if (x(s))
        return s.aborted = !0, s;
      const l = o(c, r, a);
      if (l instanceof Promise) {
        if (a.async === !1)
          throw new F();
        return l.then((f) => e._zod.parse(f, a));
      }
      return e._zod.parse(l, a);
    };
    e._zod.run = (s, c) => {
      if (c.skipChecks)
        return e._zod.parse(s, c);
      if (c.direction === "backward") {
        const l = e._zod.parse({ value: s.value, issues: [] }, { ...c, skipChecks: !0 });
        return l instanceof Promise ? l.then((f) => i(f, s, c)) : i(l, s, c);
      }
      const a = e._zod.parse(s, c);
      if (a instanceof Promise) {
        if (c.async === !1)
          throw new F();
        return a.then((l) => o(l, r, c));
      }
      return o(a, r, c);
    };
  }
  g(e, "~standard", () => ({
    validate: (o) => {
      try {
        const i = Ut(e, o);
        return i.success ? { value: i.data } : { issues: i.error?.issues };
      } catch {
        return Ft(e, o).then((s) => s.success ? { value: s.data } : { issues: s.error?.issues });
      }
    },
    vendor: "zod",
    version: 1
  }));
}), ve = /* @__PURE__ */ u("$ZodString", (e, t) => {
  _.init(e, t), e._zod.pattern = [...e?._zod.bag?.patterns ?? []].pop() ?? _n(e._zod.bag), e._zod.parse = (n, r) => {
    if (t.coerce)
      try {
        n.value = String(n.value);
      } catch {
      }
    return typeof n.value == "string" || n.issues.push({
      expected: "string",
      code: "invalid_type",
      input: n.value,
      inst: e
    }), n;
  };
}), v = /* @__PURE__ */ u("$ZodStringFormat", (e, t) => {
  se.init(e, t), ve.init(e, t);
}), Cn = /* @__PURE__ */ u("$ZodGUID", (e, t) => {
  t.pattern ?? (t.pattern = rn), v.init(e, t);
}), jn = /* @__PURE__ */ u("$ZodUUID", (e, t) => {
  if (t.version) {
    const r = {
      v1: 1,
      v2: 2,
      v3: 3,
      v4: 4,
      v5: 5,
      v6: 6,
      v7: 7,
      v8: 8
    }[t.version];
    if (r === void 0)
      throw new Error(`Invalid UUID version: "${t.version}"`);
    t.pattern ?? (t.pattern = we(r));
  } else
    t.pattern ?? (t.pattern = we());
  v.init(e, t);
}), Mn = /* @__PURE__ */ u("$ZodEmail", (e, t) => {
  t.pattern ?? (t.pattern = on), v.init(e, t);
}), xn = /* @__PURE__ */ u("$ZodURL", (e, t) => {
  v.init(e, t), e._zod.check = (n) => {
    try {
      const r = n.value.trim(), o = new URL(r);
      t.hostname && (t.hostname.lastIndex = 0, t.hostname.test(o.hostname) || n.issues.push({
        code: "invalid_format",
        format: "url",
        note: "Invalid hostname",
        pattern: t.hostname.source,
        input: n.value,
        inst: e,
        continue: !t.abort
      })), t.protocol && (t.protocol.lastIndex = 0, t.protocol.test(o.protocol.endsWith(":") ? o.protocol.slice(0, -1) : o.protocol) || n.issues.push({
        code: "invalid_format",
        format: "url",
        note: "Invalid protocol",
        pattern: t.protocol.source,
        input: n.value,
        inst: e,
        continue: !t.abort
      })), t.normalize ? n.value = o.href : n.value = r;
      return;
    } catch {
      n.issues.push({
        code: "invalid_format",
        format: "url",
        input: n.value,
        inst: e,
        continue: !t.abort
      });
    }
  };
}), Un = /* @__PURE__ */ u("$ZodEmoji", (e, t) => {
  t.pattern ?? (t.pattern = cn()), v.init(e, t);
}), Fn = /* @__PURE__ */ u("$ZodNanoID", (e, t) => {
  t.pattern ?? (t.pattern = tn), v.init(e, t);
}), Ln = /* @__PURE__ */ u("$ZodCUID", (e, t) => {
  t.pattern ?? (t.pattern = Yt), v.init(e, t);
}), Jn = /* @__PURE__ */ u("$ZodCUID2", (e, t) => {
  t.pattern ?? (t.pattern = qt), v.init(e, t);
}), Hn = /* @__PURE__ */ u("$ZodULID", (e, t) => {
  t.pattern ?? (t.pattern = Qt), v.init(e, t);
}), Vn = /* @__PURE__ */ u("$ZodXID", (e, t) => {
  t.pattern ?? (t.pattern = Xt), v.init(e, t);
}), Wn = /* @__PURE__ */ u("$ZodKSUID", (e, t) => {
  t.pattern ?? (t.pattern = en), v.init(e, t);
}), Bn = /* @__PURE__ */ u("$ZodISODateTime", (e, t) => {
  t.pattern ?? (t.pattern = gn(t)), v.init(e, t);
}), Kn = /* @__PURE__ */ u("$ZodISODate", (e, t) => {
  t.pattern ?? (t.pattern = pn), v.init(e, t);
}), Gn = /* @__PURE__ */ u("$ZodISOTime", (e, t) => {
  t.pattern ?? (t.pattern = mn(t)), v.init(e, t);
}), Yn = /* @__PURE__ */ u("$ZodISODuration", (e, t) => {
  t.pattern ?? (t.pattern = nn), v.init(e, t);
}), qn = /* @__PURE__ */ u("$ZodIPv4", (e, t) => {
  t.pattern ?? (t.pattern = an), v.init(e, t), e._zod.bag.format = "ipv4";
}), Qn = /* @__PURE__ */ u("$ZodIPv6", (e, t) => {
  t.pattern ?? (t.pattern = un), v.init(e, t), e._zod.bag.format = "ipv6", e._zod.check = (n) => {
    try {
      new URL(`http://[${n.value}]`);
    } catch {
      n.issues.push({
        code: "invalid_format",
        format: "ipv6",
        input: n.value,
        inst: e,
        continue: !t.abort
      });
    }
  };
}), Xn = /* @__PURE__ */ u("$ZodCIDRv4", (e, t) => {
  t.pattern ?? (t.pattern = ln), v.init(e, t);
}), er = /* @__PURE__ */ u("$ZodCIDRv6", (e, t) => {
  t.pattern ?? (t.pattern = fn), v.init(e, t), e._zod.check = (n) => {
    const r = n.value.split("/");
    try {
      if (r.length !== 2)
        throw new Error();
      const [o, i] = r;
      if (!i)
        throw new Error();
      const s = Number(i);
      if (`${s}` !== i)
        throw new Error();
      if (s < 0 || s > 128)
        throw new Error();
      new URL(`http://[${o}]`);
    } catch {
      n.issues.push({
        code: "invalid_format",
        format: "cidrv6",
        input: n.value,
        inst: e,
        continue: !t.abort
      });
    }
  };
});
function nt(e) {
  if (e === "")
    return !0;
  if (e.length % 4 !== 0)
    return !1;
  try {
    return atob(e), !0;
  } catch {
    return !1;
  }
}
const tr = /* @__PURE__ */ u("$ZodBase64", (e, t) => {
  t.pattern ?? (t.pattern = dn), v.init(e, t), e._zod.bag.contentEncoding = "base64", e._zod.check = (n) => {
    nt(n.value) || n.issues.push({
      code: "invalid_format",
      format: "base64",
      input: n.value,
      inst: e,
      continue: !t.abort
    });
  };
});
function nr(e) {
  if (!Ge.test(e))
    return !1;
  const t = e.replace(/[-_]/g, (r) => r === "-" ? "+" : "/"), n = t.padEnd(Math.ceil(t.length / 4) * 4, "=");
  return nt(n);
}
const rr = /* @__PURE__ */ u("$ZodBase64URL", (e, t) => {
  t.pattern ?? (t.pattern = Ge), v.init(e, t), e._zod.bag.contentEncoding = "base64url", e._zod.check = (n) => {
    nr(n.value) || n.issues.push({
      code: "invalid_format",
      format: "base64url",
      input: n.value,
      inst: e,
      continue: !t.abort
    });
  };
}), or = /* @__PURE__ */ u("$ZodE164", (e, t) => {
  t.pattern ?? (t.pattern = hn), v.init(e, t);
});
function sr(e, t = null) {
  try {
    const n = e.split(".");
    if (n.length !== 3)
      return !1;
    const [r] = n;
    if (!r)
      return !1;
    const o = JSON.parse(atob(r));
    return !("typ" in o && o?.typ !== "JWT" || !o.alg || t && (!("alg" in o) || o.alg !== t));
  } catch {
    return !1;
  }
}
const ir = /* @__PURE__ */ u("$ZodJWT", (e, t) => {
  v.init(e, t), e._zod.check = (n) => {
    sr(n.value, t.alg) || n.issues.push({
      code: "invalid_format",
      format: "jwt",
      input: n.value,
      inst: e,
      continue: !t.abort
    });
  };
}), rt = /* @__PURE__ */ u("$ZodNumber", (e, t) => {
  _.init(e, t), e._zod.pattern = e._zod.bag.pattern ?? Qe, e._zod.parse = (n, r) => {
    if (t.coerce)
      try {
        n.value = Number(n.value);
      } catch {
      }
    const o = n.value;
    if (typeof o == "number" && !Number.isNaN(o) && Number.isFinite(o))
      return n;
    const i = typeof o == "number" ? Number.isNaN(o) ? "NaN" : Number.isFinite(o) ? void 0 : "Infinity" : void 0;
    return n.issues.push({
      expected: "number",
      code: "invalid_type",
      input: o,
      inst: e,
      ...i ? { received: i } : {}
    }), n;
  };
}), cr = /* @__PURE__ */ u("$ZodNumberFormat", (e, t) => {
  kn.init(e, t), rt.init(e, t);
}), ar = /* @__PURE__ */ u("$ZodBoolean", (e, t) => {
  _.init(e, t), e._zod.pattern = yn, e._zod.parse = (n, r) => {
    if (t.coerce)
      try {
        n.value = !!n.value;
      } catch {
      }
    const o = n.value;
    return typeof o == "boolean" || n.issues.push({
      expected: "boolean",
      code: "invalid_type",
      input: o,
      inst: e
    }), n;
  };
}), ur = /* @__PURE__ */ u("$ZodAny", (e, t) => {
  _.init(e, t), e._zod.parse = (n) => n;
}), lr = /* @__PURE__ */ u("$ZodUnknown", (e, t) => {
  _.init(e, t), e._zod.parse = (n) => n;
}), fr = /* @__PURE__ */ u("$ZodNever", (e, t) => {
  _.init(e, t), e._zod.parse = (n, r) => (n.issues.push({
    expected: "never",
    code: "invalid_type",
    input: n.value,
    inst: e
  }), n);
});
function ze(e, t, n) {
  e.issues.length && t.issues.push(...U(n, e.issues)), t.value[n] = e.value;
}
const dr = /* @__PURE__ */ u("$ZodArray", (e, t) => {
  _.init(e, t), e._zod.parse = (n, r) => {
    const o = n.value;
    if (!Array.isArray(o))
      return n.issues.push({
        expected: "array",
        code: "invalid_type",
        input: o,
        inst: e
      }), n;
    n.value = Array(o.length);
    const i = [];
    for (let s = 0; s < o.length; s++) {
      const c = o[s], a = t.element._zod.run({
        value: c,
        issues: []
      }, r);
      a instanceof Promise ? i.push(a.then((l) => ze(l, n, s))) : ze(a, n, s);
    }
    return i.length ? Promise.all(i).then(() => n) : n;
  };
});
function X(e, t, n, r, o) {
  if (e.issues.length) {
    if (o && !(n in r))
      return;
    t.issues.push(...U(n, e.issues));
  }
  e.value === void 0 ? n in r && (t.value[n] = void 0) : t.value[n] = e.value;
}
function ot(e) {
  const t = Object.keys(e.shape);
  for (const r of t)
    if (!e.shape?.[r]?._zod?.traits?.has("$ZodType"))
      throw new Error(`Invalid element at key "${r}": expected a Zod schema`);
  const n = It(e.shape);
  return {
    ...e,
    keys: t,
    keySet: new Set(t),
    numKeys: t.length,
    optionalKeys: new Set(n)
  };
}
function st(e, t, n, r, o, i) {
  const s = [], c = o.keySet, a = o.catchall._zod, l = a.def.type, f = a.optout === "optional";
  for (const d in t) {
    if (c.has(d))
      continue;
    if (l === "never") {
      s.push(d);
      continue;
    }
    const p = a.run({ value: t[d], issues: [] }, r);
    p instanceof Promise ? e.push(p.then((m) => X(m, n, d, t, f))) : X(p, n, d, t, f);
  }
  return s.length && n.issues.push({
    code: "unrecognized_keys",
    keys: s,
    input: t,
    inst: i
  }), e.length ? Promise.all(e).then(() => n) : n;
}
const hr = /* @__PURE__ */ u("$ZodObject", (e, t) => {
  if (_.init(e, t), !Object.getOwnPropertyDescriptor(t, "shape")?.get) {
    const c = t.shape;
    Object.defineProperty(t, "shape", {
      get: () => {
        const a = { ...c };
        return Object.defineProperty(t, "shape", {
          value: a
        }), a;
      }
    });
  }
  const r = ne(() => ot(t));
  g(e._zod, "propValues", () => {
    const c = t.shape, a = {};
    for (const l in c) {
      const f = c[l]._zod;
      if (f.values) {
        a[l] ?? (a[l] = /* @__PURE__ */ new Set());
        for (const d of f.values)
          a[l].add(d);
      }
    }
    return a;
  });
  const o = W, i = t.catchall;
  let s;
  e._zod.parse = (c, a) => {
    s ?? (s = r.value);
    const l = c.value;
    if (!o(l))
      return c.issues.push({
        expected: "object",
        code: "invalid_type",
        input: l,
        inst: e
      }), c;
    c.value = {};
    const f = [], d = s.shape;
    for (const p of s.keys) {
      const m = d[p], k = m._zod.optout === "optional", z = m._zod.run({ value: l[p], issues: [] }, a);
      z instanceof Promise ? f.push(z.then((K) => X(K, c, p, l, k))) : X(z, c, p, l, k);
    }
    return i ? st(f, l, c, a, r.value, e) : f.length ? Promise.all(f).then(() => c) : c;
  };
}), pr = /* @__PURE__ */ u("$ZodObjectJIT", (e, t) => {
  hr.init(e, t);
  const n = e._zod.parse, r = ne(() => ot(t)), o = (p) => {
    const m = new Dn(["shape", "payload", "ctx"]), k = r.value, z = (A) => {
      const Z = be(A);
      return `shape[${Z}]._zod.run({ value: input[${Z}], issues: [] }, ctx)`;
    };
    m.write("const input = payload.value;");
    const K = /* @__PURE__ */ Object.create(null);
    let wt = 0;
    for (const A of k.keys)
      K[A] = `key_${wt++}`;
    m.write("const newResult = {};");
    for (const A of k.keys) {
      const Z = K[A], N = be(A), kt = p[A]?._zod?.optout === "optional";
      m.write(`const ${Z} = ${z(A)};`), kt ? m.write(`
        if (${Z}.issues.length) {
          if (${N} in input) {
            payload.issues = payload.issues.concat(${Z}.issues.map(iss => ({
              ...iss,
              path: iss.path ? [${N}, ...iss.path] : [${N}]
            })));
          }
        }
        
        if (${Z}.value === undefined) {
          if (${N} in input) {
            newResult[${N}] = undefined;
          }
        } else {
          newResult[${N}] = ${Z}.value;
        }
        
      `) : m.write(`
        if (${Z}.issues.length) {
          payload.issues = payload.issues.concat(${Z}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${N}, ...iss.path] : [${N}]
          })));
        }
        
        if (${Z}.value === undefined) {
          if (${N} in input) {
            newResult[${N}] = undefined;
          }
        } else {
          newResult[${N}] = ${Z}.value;
        }
        
      `);
    }
    m.write("payload.value = newResult;"), m.write("return payload;");
    const zt = m.compile();
    return (A, Z) => zt(p, A, Z);
  };
  let i;
  const s = W, c = !Le.jitless, l = c && Et.value, f = t.catchall;
  let d;
  e._zod.parse = (p, m) => {
    d ?? (d = r.value);
    const k = p.value;
    return s(k) ? c && l && m?.async === !1 && m.jitless !== !0 ? (i || (i = o(t.shape)), p = i(p, m), f ? st([], k, p, m, d, e) : p) : n(p, m) : (p.issues.push({
      expected: "object",
      code: "invalid_type",
      input: k,
      inst: e
    }), p);
  };
});
function ke(e, t, n, r) {
  for (const i of e)
    if (i.issues.length === 0)
      return t.value = i.value, t;
  const o = e.filter((i) => !x(i));
  return o.length === 1 ? (t.value = o[0].value, o[0]) : (t.issues.push({
    code: "invalid_union",
    input: t.value,
    inst: n,
    errors: e.map((i) => i.issues.map((s) => D(s, r, P())))
  }), t);
}
const it = /* @__PURE__ */ u("$ZodUnion", (e, t) => {
  _.init(e, t), g(e._zod, "optin", () => t.options.some((o) => o._zod.optin === "optional") ? "optional" : void 0), g(e._zod, "optout", () => t.options.some((o) => o._zod.optout === "optional") ? "optional" : void 0), g(e._zod, "values", () => {
    if (t.options.every((o) => o._zod.values))
      return new Set(t.options.flatMap((o) => Array.from(o._zod.values)));
  }), g(e._zod, "pattern", () => {
    if (t.options.every((o) => o._zod.pattern)) {
      const o = t.options.map((i) => i._zod.pattern);
      return new RegExp(`^(${o.map((i) => pe(i.source)).join("|")})$`);
    }
  });
  const n = t.options.length === 1, r = t.options[0]._zod.run;
  e._zod.parse = (o, i) => {
    if (n)
      return r(o, i);
    let s = !1;
    const c = [];
    for (const a of t.options) {
      const l = a._zod.run({
        value: o.value,
        issues: []
      }, i);
      if (l instanceof Promise)
        c.push(l), s = !0;
      else {
        if (l.issues.length === 0)
          return l;
        c.push(l);
      }
    }
    return s ? Promise.all(c).then((a) => ke(a, o, e, i)) : ke(c, o, e, i);
  };
}), mr = /* @__PURE__ */ u("$ZodDiscriminatedUnion", (e, t) => {
  t.inclusive = !1, it.init(e, t);
  const n = e._zod.parse;
  g(e._zod, "propValues", () => {
    const o = {};
    for (const i of t.options) {
      const s = i._zod.propValues;
      if (!s || Object.keys(s).length === 0)
        throw new Error(`Invalid discriminated union option at index "${t.options.indexOf(i)}"`);
      for (const [c, a] of Object.entries(s)) {
        o[c] || (o[c] = /* @__PURE__ */ new Set());
        for (const l of a)
          o[c].add(l);
      }
    }
    return o;
  });
  const r = ne(() => {
    const o = t.options, i = /* @__PURE__ */ new Map();
    for (const s of o) {
      const c = s._zod.propValues?.[t.discriminator];
      if (!c || c.size === 0)
        throw new Error(`Invalid discriminated union option at index "${t.options.indexOf(s)}"`);
      for (const a of c) {
        if (i.has(a))
          throw new Error(`Duplicate discriminator value "${String(a)}"`);
        i.set(a, s);
      }
    }
    return i;
  });
  e._zod.parse = (o, i) => {
    const s = o.value;
    if (!W(s))
      return o.issues.push({
        code: "invalid_type",
        expected: "object",
        input: s,
        inst: e
      }), o;
    const c = r.value.get(s?.[t.discriminator]);
    return c ? c._zod.run(o, i) : t.unionFallback ? n(o, i) : (o.issues.push({
      code: "invalid_union",
      errors: [],
      note: "No matching discriminator",
      discriminator: t.discriminator,
      input: s,
      path: [t.discriminator],
      inst: e
    }), o);
  };
}), gr = /* @__PURE__ */ u("$ZodIntersection", (e, t) => {
  _.init(e, t), e._zod.parse = (n, r) => {
    const o = n.value, i = t.left._zod.run({ value: o, issues: [] }, r), s = t.right._zod.run({ value: o, issues: [] }, r);
    return i instanceof Promise || s instanceof Promise ? Promise.all([i, s]).then(([a, l]) => $e(n, a, l)) : $e(n, i, s);
  };
});
function le(e, t) {
  if (e === t)
    return { valid: !0, data: e };
  if (e instanceof Date && t instanceof Date && +e == +t)
    return { valid: !0, data: e };
  if (L(e) && L(t)) {
    const n = Object.keys(t), r = Object.keys(e).filter((i) => n.indexOf(i) !== -1), o = { ...e, ...t };
    for (const i of r) {
      const s = le(e[i], t[i]);
      if (!s.valid)
        return {
          valid: !1,
          mergeErrorPath: [i, ...s.mergeErrorPath]
        };
      o[i] = s.data;
    }
    return { valid: !0, data: o };
  }
  if (Array.isArray(e) && Array.isArray(t)) {
    if (e.length !== t.length)
      return { valid: !1, mergeErrorPath: [] };
    const n = [];
    for (let r = 0; r < e.length; r++) {
      const o = e[r], i = t[r], s = le(o, i);
      if (!s.valid)
        return {
          valid: !1,
          mergeErrorPath: [r, ...s.mergeErrorPath]
        };
      n.push(s.data);
    }
    return { valid: !0, data: n };
  }
  return { valid: !1, mergeErrorPath: [] };
}
function $e(e, t, n) {
  const r = /* @__PURE__ */ new Map();
  let o;
  for (const c of t.issues)
    if (c.code === "unrecognized_keys") {
      o ?? (o = c);
      for (const a of c.keys)
        r.has(a) || r.set(a, {}), r.get(a).l = !0;
    } else
      e.issues.push(c);
  for (const c of n.issues)
    if (c.code === "unrecognized_keys")
      for (const a of c.keys)
        r.has(a) || r.set(a, {}), r.get(a).r = !0;
    else
      e.issues.push(c);
  const i = [...r].filter(([, c]) => c.l && c.r).map(([c]) => c);
  if (i.length && o && e.issues.push({ ...o, keys: i }), x(e))
    return e;
  const s = le(t.value, n.value);
  if (!s.valid)
    throw new Error(`Unmergable intersection. Error path: ${JSON.stringify(s.mergeErrorPath)}`);
  return e.value = s.data, e;
}
const _r = /* @__PURE__ */ u("$ZodRecord", (e, t) => {
  _.init(e, t), e._zod.parse = (n, r) => {
    const o = n.value;
    if (!L(o))
      return n.issues.push({
        expected: "record",
        code: "invalid_type",
        input: o,
        inst: e
      }), n;
    const i = [], s = t.keyType._zod.values;
    if (s) {
      n.value = {};
      const c = /* @__PURE__ */ new Set();
      for (const l of s)
        if (typeof l == "string" || typeof l == "number" || typeof l == "symbol") {
          c.add(typeof l == "number" ? l.toString() : l);
          const f = t.valueType._zod.run({ value: o[l], issues: [] }, r);
          f instanceof Promise ? i.push(f.then((d) => {
            d.issues.length && n.issues.push(...U(l, d.issues)), n.value[l] = d.value;
          })) : (f.issues.length && n.issues.push(...U(l, f.issues)), n.value[l] = f.value);
        }
      let a;
      for (const l in o)
        c.has(l) || (a = a ?? [], a.push(l));
      a && a.length > 0 && n.issues.push({
        code: "unrecognized_keys",
        input: o,
        inst: e,
        keys: a
      });
    } else {
      n.value = {};
      for (const c of Reflect.ownKeys(o)) {
        if (c === "__proto__")
          continue;
        let a = t.keyType._zod.run({ value: c, issues: [] }, r);
        if (a instanceof Promise)
          throw new Error("Async schemas not supported in object keys currently");
        if (typeof c == "string" && Qe.test(c) && a.issues.length) {
          const d = t.keyType._zod.run({ value: Number(c), issues: [] }, r);
          if (d instanceof Promise)
            throw new Error("Async schemas not supported in object keys currently");
          d.issues.length === 0 && (a = d);
        }
        if (a.issues.length) {
          t.mode === "loose" ? n.value[c] = o[c] : n.issues.push({
            code: "invalid_key",
            origin: "record",
            issues: a.issues.map((d) => D(d, r, P())),
            input: c,
            path: [c],
            inst: e
          });
          continue;
        }
        const f = t.valueType._zod.run({ value: o[c], issues: [] }, r);
        f instanceof Promise ? i.push(f.then((d) => {
          d.issues.length && n.issues.push(...U(c, d.issues)), n.value[a.value] = d.value;
        })) : (f.issues.length && n.issues.push(...U(c, f.issues)), n.value[a.value] = f.value);
      }
    }
    return i.length ? Promise.all(i).then(() => n) : n;
  };
}), vr = /* @__PURE__ */ u("$ZodEnum", (e, t) => {
  _.init(e, t);
  const n = Je(t.entries), r = new Set(n);
  e._zod.values = r, e._zod.pattern = new RegExp(`^(${n.filter((o) => Ot.has(typeof o)).map((o) => typeof o == "string" ? J(o) : o.toString()).join("|")})$`), e._zod.parse = (o, i) => {
    const s = o.value;
    return r.has(s) || o.issues.push({
      code: "invalid_value",
      values: n,
      input: s,
      inst: e
    }), o;
  };
}), yr = /* @__PURE__ */ u("$ZodLiteral", (e, t) => {
  if (_.init(e, t), t.values.length === 0)
    throw new Error("Cannot create literal schema with no valid values");
  const n = new Set(t.values);
  e._zod.values = n, e._zod.pattern = new RegExp(`^(${t.values.map((r) => typeof r == "string" ? J(r) : r ? J(r.toString()) : String(r)).join("|")})$`), e._zod.parse = (r, o) => {
    const i = r.value;
    return n.has(i) || r.issues.push({
      code: "invalid_value",
      values: t.values,
      input: i,
      inst: e
    }), r;
  };
}), br = /* @__PURE__ */ u("$ZodTransform", (e, t) => {
  _.init(e, t), e._zod.parse = (n, r) => {
    if (r.direction === "backward")
      throw new Fe(e.constructor.name);
    const o = t.transform(n.value, n);
    if (r.async)
      return (o instanceof Promise ? o : Promise.resolve(o)).then((s) => (n.value = s, n));
    if (o instanceof Promise)
      throw new F();
    return n.value = o, n;
  };
});
function Ze(e, t) {
  return e.issues.length && t === void 0 ? { issues: [], value: void 0 } : e;
}
const ct = /* @__PURE__ */ u("$ZodOptional", (e, t) => {
  _.init(e, t), e._zod.optin = "optional", e._zod.optout = "optional", g(e._zod, "values", () => t.innerType._zod.values ? /* @__PURE__ */ new Set([...t.innerType._zod.values, void 0]) : void 0), g(e._zod, "pattern", () => {
    const n = t.innerType._zod.pattern;
    return n ? new RegExp(`^(${pe(n.source)})?$`) : void 0;
  }), e._zod.parse = (n, r) => {
    if (t.innerType._zod.optin === "optional") {
      const o = t.innerType._zod.run(n, r);
      return o instanceof Promise ? o.then((i) => Ze(i, n.value)) : Ze(o, n.value);
    }
    return n.value === void 0 ? n : t.innerType._zod.run(n, r);
  };
}), wr = /* @__PURE__ */ u("$ZodExactOptional", (e, t) => {
  ct.init(e, t), g(e._zod, "values", () => t.innerType._zod.values), g(e._zod, "pattern", () => t.innerType._zod.pattern), e._zod.parse = (n, r) => t.innerType._zod.run(n, r);
}), zr = /* @__PURE__ */ u("$ZodNullable", (e, t) => {
  _.init(e, t), g(e._zod, "optin", () => t.innerType._zod.optin), g(e._zod, "optout", () => t.innerType._zod.optout), g(e._zod, "pattern", () => {
    const n = t.innerType._zod.pattern;
    return n ? new RegExp(`^(${pe(n.source)}|null)$`) : void 0;
  }), g(e._zod, "values", () => t.innerType._zod.values ? /* @__PURE__ */ new Set([...t.innerType._zod.values, null]) : void 0), e._zod.parse = (n, r) => n.value === null ? n : t.innerType._zod.run(n, r);
}), kr = /* @__PURE__ */ u("$ZodDefault", (e, t) => {
  _.init(e, t), e._zod.optin = "optional", g(e._zod, "values", () => t.innerType._zod.values), e._zod.parse = (n, r) => {
    if (r.direction === "backward")
      return t.innerType._zod.run(n, r);
    if (n.value === void 0)
      return n.value = t.defaultValue, n;
    const o = t.innerType._zod.run(n, r);
    return o instanceof Promise ? o.then((i) => Se(i, t)) : Se(o, t);
  };
});
function Se(e, t) {
  return e.value === void 0 && (e.value = t.defaultValue), e;
}
const $r = /* @__PURE__ */ u("$ZodPrefault", (e, t) => {
  _.init(e, t), e._zod.optin = "optional", g(e._zod, "values", () => t.innerType._zod.values), e._zod.parse = (n, r) => (r.direction === "backward" || n.value === void 0 && (n.value = t.defaultValue), t.innerType._zod.run(n, r));
}), Zr = /* @__PURE__ */ u("$ZodNonOptional", (e, t) => {
  _.init(e, t), g(e._zod, "values", () => {
    const n = t.innerType._zod.values;
    return n ? new Set([...n].filter((r) => r !== void 0)) : void 0;
  }), e._zod.parse = (n, r) => {
    const o = t.innerType._zod.run(n, r);
    return o instanceof Promise ? o.then((i) => Ee(i, e)) : Ee(o, e);
  };
});
function Ee(e, t) {
  return !e.issues.length && e.value === void 0 && e.issues.push({
    code: "invalid_type",
    expected: "nonoptional",
    input: e.value,
    inst: t
  }), e;
}
const Sr = /* @__PURE__ */ u("$ZodCatch", (e, t) => {
  _.init(e, t), g(e._zod, "optin", () => t.innerType._zod.optin), g(e._zod, "optout", () => t.innerType._zod.optout), g(e._zod, "values", () => t.innerType._zod.values), e._zod.parse = (n, r) => {
    if (r.direction === "backward")
      return t.innerType._zod.run(n, r);
    const o = t.innerType._zod.run(n, r);
    return o instanceof Promise ? o.then((i) => (n.value = i.value, i.issues.length && (n.value = t.catchValue({
      ...n,
      error: {
        issues: i.issues.map((s) => D(s, r, P()))
      },
      input: n.value
    }), n.issues = []), n)) : (n.value = o.value, o.issues.length && (n.value = t.catchValue({
      ...n,
      error: {
        issues: o.issues.map((i) => D(i, r, P()))
      },
      input: n.value
    }), n.issues = []), n);
  };
}), Er = /* @__PURE__ */ u("$ZodPipe", (e, t) => {
  _.init(e, t), g(e._zod, "values", () => t.in._zod.values), g(e._zod, "optin", () => t.in._zod.optin), g(e._zod, "optout", () => t.out._zod.optout), g(e._zod, "propValues", () => t.in._zod.propValues), e._zod.parse = (n, r) => {
    if (r.direction === "backward") {
      const i = t.out._zod.run(n, r);
      return i instanceof Promise ? i.then((s) => Y(s, t.in, r)) : Y(i, t.in, r);
    }
    const o = t.in._zod.run(n, r);
    return o instanceof Promise ? o.then((i) => Y(i, t.out, r)) : Y(o, t.out, r);
  };
});
function Y(e, t, n) {
  return e.issues.length ? (e.aborted = !0, e) : t._zod.run({ value: e.value, issues: e.issues }, n);
}
const Or = /* @__PURE__ */ u("$ZodReadonly", (e, t) => {
  _.init(e, t), g(e._zod, "propValues", () => t.innerType._zod.propValues), g(e._zod, "values", () => t.innerType._zod.values), g(e._zod, "optin", () => t.innerType?._zod?.optin), g(e._zod, "optout", () => t.innerType?._zod?.optout), e._zod.parse = (n, r) => {
    if (r.direction === "backward")
      return t.innerType._zod.run(n, r);
    const o = t.innerType._zod.run(n, r);
    return o instanceof Promise ? o.then(Oe) : Oe(o);
  };
});
function Oe(e) {
  return e.value = Object.freeze(e.value), e;
}
const Ir = /* @__PURE__ */ u("$ZodCustom", (e, t) => {
  S.init(e, t), _.init(e, t), e._zod.parse = (n, r) => n, e._zod.check = (n) => {
    const r = n.value, o = t.fn(r);
    if (o instanceof Promise)
      return o.then((i) => Ie(i, n, r, e));
    Ie(o, n, r, e);
  };
});
function Ie(e, t, n, r) {
  if (!e) {
    const o = {
      code: "custom",
      input: n,
      inst: r,
      // incorporates params.error into issue reporting
      path: [...r._zod.def.path ?? []],
      // incorporates params.error into issue reporting
      continue: !r._zod.def.abort
      // params: inst._zod.def.params,
    };
    r._zod.def.params && (o.params = r._zod.def.params), t.issues.push(B(o));
  }
}
var Ne;
class Nr {
  constructor() {
    this._map = /* @__PURE__ */ new WeakMap(), this._idmap = /* @__PURE__ */ new Map();
  }
  add(t, ...n) {
    const r = n[0];
    return this._map.set(t, r), r && typeof r == "object" && "id" in r && this._idmap.set(r.id, t), this;
  }
  clear() {
    return this._map = /* @__PURE__ */ new WeakMap(), this._idmap = /* @__PURE__ */ new Map(), this;
  }
  remove(t) {
    const n = this._map.get(t);
    return n && typeof n == "object" && "id" in n && this._idmap.delete(n.id), this._map.delete(t), this;
  }
  get(t) {
    const n = t._zod.parent;
    if (n) {
      const r = { ...this.get(n) ?? {} };
      delete r.id;
      const o = { ...r, ...this._map.get(t) };
      return Object.keys(o).length ? o : void 0;
    }
    return this._map.get(t);
  }
  has(t) {
    return this._map.has(t);
  }
}
function Tr() {
  return new Nr();
}
(Ne = globalThis).__zod_globalRegistry ?? (Ne.__zod_globalRegistry = Tr());
const V = globalThis.__zod_globalRegistry;
// @__NO_SIDE_EFFECTS__
function Ar(e, t) {
  return new e({
    type: "string",
    ...h(t)
  });
}
// @__NO_SIDE_EFFECTS__
function Pr(e, t) {
  return new e({
    type: "string",
    format: "email",
    check: "string_format",
    abort: !1,
    ...h(t)
  });
}
// @__NO_SIDE_EFFECTS__
function Te(e, t) {
  return new e({
    type: "string",
    format: "guid",
    check: "string_format",
    abort: !1,
    ...h(t)
  });
}
// @__NO_SIDE_EFFECTS__
function Dr(e, t) {
  return new e({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: !1,
    ...h(t)
  });
}
// @__NO_SIDE_EFFECTS__
function Rr(e, t) {
  return new e({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: !1,
    version: "v4",
    ...h(t)
  });
}
// @__NO_SIDE_EFFECTS__
function Cr(e, t) {
  return new e({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: !1,
    version: "v6",
    ...h(t)
  });
}
// @__NO_SIDE_EFFECTS__
function jr(e, t) {
  return new e({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: !1,
    version: "v7",
    ...h(t)
  });
}
// @__NO_SIDE_EFFECTS__
function Mr(e, t) {
  return new e({
    type: "string",
    format: "url",
    check: "string_format",
    abort: !1,
    ...h(t)
  });
}
// @__NO_SIDE_EFFECTS__
function xr(e, t) {
  return new e({
    type: "string",
    format: "emoji",
    check: "string_format",
    abort: !1,
    ...h(t)
  });
}
// @__NO_SIDE_EFFECTS__
function Ur(e, t) {
  return new e({
    type: "string",
    format: "nanoid",
    check: "string_format",
    abort: !1,
    ...h(t)
  });
}
// @__NO_SIDE_EFFECTS__
function Fr(e, t) {
  return new e({
    type: "string",
    format: "cuid",
    check: "string_format",
    abort: !1,
    ...h(t)
  });
}
// @__NO_SIDE_EFFECTS__
function Lr(e, t) {
  return new e({
    type: "string",
    format: "cuid2",
    check: "string_format",
    abort: !1,
    ...h(t)
  });
}
// @__NO_SIDE_EFFECTS__
function Jr(e, t) {
  return new e({
    type: "string",
    format: "ulid",
    check: "string_format",
    abort: !1,
    ...h(t)
  });
}
// @__NO_SIDE_EFFECTS__
function Hr(e, t) {
  return new e({
    type: "string",
    format: "xid",
    check: "string_format",
    abort: !1,
    ...h(t)
  });
}
// @__NO_SIDE_EFFECTS__
function Vr(e, t) {
  return new e({
    type: "string",
    format: "ksuid",
    check: "string_format",
    abort: !1,
    ...h(t)
  });
}
// @__NO_SIDE_EFFECTS__
function Wr(e, t) {
  return new e({
    type: "string",
    format: "ipv4",
    check: "string_format",
    abort: !1,
    ...h(t)
  });
}
// @__NO_SIDE_EFFECTS__
function Br(e, t) {
  return new e({
    type: "string",
    format: "ipv6",
    check: "string_format",
    abort: !1,
    ...h(t)
  });
}
// @__NO_SIDE_EFFECTS__
function Kr(e, t) {
  return new e({
    type: "string",
    format: "cidrv4",
    check: "string_format",
    abort: !1,
    ...h(t)
  });
}
// @__NO_SIDE_EFFECTS__
function Gr(e, t) {
  return new e({
    type: "string",
    format: "cidrv6",
    check: "string_format",
    abort: !1,
    ...h(t)
  });
}
// @__NO_SIDE_EFFECTS__
function Yr(e, t) {
  return new e({
    type: "string",
    format: "base64",
    check: "string_format",
    abort: !1,
    ...h(t)
  });
}
// @__NO_SIDE_EFFECTS__
function qr(e, t) {
  return new e({
    type: "string",
    format: "base64url",
    check: "string_format",
    abort: !1,
    ...h(t)
  });
}
// @__NO_SIDE_EFFECTS__
function Qr(e, t) {
  return new e({
    type: "string",
    format: "e164",
    check: "string_format",
    abort: !1,
    ...h(t)
  });
}
// @__NO_SIDE_EFFECTS__
function Xr(e, t) {
  return new e({
    type: "string",
    format: "jwt",
    check: "string_format",
    abort: !1,
    ...h(t)
  });
}
// @__NO_SIDE_EFFECTS__
function eo(e, t) {
  return new e({
    type: "string",
    format: "datetime",
    check: "string_format",
    offset: !1,
    local: !1,
    precision: null,
    ...h(t)
  });
}
// @__NO_SIDE_EFFECTS__
function to(e, t) {
  return new e({
    type: "string",
    format: "date",
    check: "string_format",
    ...h(t)
  });
}
// @__NO_SIDE_EFFECTS__
function no(e, t) {
  return new e({
    type: "string",
    format: "time",
    check: "string_format",
    precision: null,
    ...h(t)
  });
}
// @__NO_SIDE_EFFECTS__
function ro(e, t) {
  return new e({
    type: "string",
    format: "duration",
    check: "string_format",
    ...h(t)
  });
}
// @__NO_SIDE_EFFECTS__
function oo(e, t) {
  return new e({
    type: "number",
    checks: [],
    ...h(t)
  });
}
// @__NO_SIDE_EFFECTS__
function so(e, t) {
  return new e({
    type: "number",
    check: "number_format",
    abort: !1,
    format: "safeint",
    ...h(t)
  });
}
// @__NO_SIDE_EFFECTS__
function io(e, t) {
  return new e({
    type: "boolean",
    ...h(t)
  });
}
// @__NO_SIDE_EFFECTS__
function co(e) {
  return new e({
    type: "any"
  });
}
// @__NO_SIDE_EFFECTS__
function ao(e) {
  return new e({
    type: "unknown"
  });
}
// @__NO_SIDE_EFFECTS__
function uo(e, t) {
  return new e({
    type: "never",
    ...h(t)
  });
}
// @__NO_SIDE_EFFECTS__
function Ae(e, t) {
  return new et({
    check: "less_than",
    ...h(t),
    value: e,
    inclusive: !1
  });
}
// @__NO_SIDE_EFFECTS__
function ie(e, t) {
  return new et({
    check: "less_than",
    ...h(t),
    value: e,
    inclusive: !0
  });
}
// @__NO_SIDE_EFFECTS__
function Pe(e, t) {
  return new tt({
    check: "greater_than",
    ...h(t),
    value: e,
    inclusive: !1
  });
}
// @__NO_SIDE_EFFECTS__
function ce(e, t) {
  return new tt({
    check: "greater_than",
    ...h(t),
    value: e,
    inclusive: !0
  });
}
// @__NO_SIDE_EFFECTS__
function De(e, t) {
  return new zn({
    check: "multiple_of",
    ...h(t),
    value: e
  });
}
// @__NO_SIDE_EFFECTS__
function at(e, t) {
  return new $n({
    check: "max_length",
    ...h(t),
    maximum: e
  });
}
// @__NO_SIDE_EFFECTS__
function ee(e, t) {
  return new Zn({
    check: "min_length",
    ...h(t),
    minimum: e
  });
}
// @__NO_SIDE_EFFECTS__
function ut(e, t) {
  return new Sn({
    check: "length_equals",
    ...h(t),
    length: e
  });
}
// @__NO_SIDE_EFFECTS__
function lo(e, t) {
  return new En({
    check: "string_format",
    format: "regex",
    ...h(t),
    pattern: e
  });
}
// @__NO_SIDE_EFFECTS__
function fo(e) {
  return new On({
    check: "string_format",
    format: "lowercase",
    ...h(e)
  });
}
// @__NO_SIDE_EFFECTS__
function ho(e) {
  return new In({
    check: "string_format",
    format: "uppercase",
    ...h(e)
  });
}
// @__NO_SIDE_EFFECTS__
function po(e, t) {
  return new Nn({
    check: "string_format",
    format: "includes",
    ...h(t),
    includes: e
  });
}
// @__NO_SIDE_EFFECTS__
function mo(e, t) {
  return new Tn({
    check: "string_format",
    format: "starts_with",
    ...h(t),
    prefix: e
  });
}
// @__NO_SIDE_EFFECTS__
function go(e, t) {
  return new An({
    check: "string_format",
    format: "ends_with",
    ...h(t),
    suffix: e
  });
}
// @__NO_SIDE_EFFECTS__
function H(e) {
  return new Pn({
    check: "overwrite",
    tx: e
  });
}
// @__NO_SIDE_EFFECTS__
function _o(e) {
  return /* @__PURE__ */ H((t) => t.normalize(e));
}
// @__NO_SIDE_EFFECTS__
function vo() {
  return /* @__PURE__ */ H((e) => e.trim());
}
// @__NO_SIDE_EFFECTS__
function yo() {
  return /* @__PURE__ */ H((e) => e.toLowerCase());
}
// @__NO_SIDE_EFFECTS__
function bo() {
  return /* @__PURE__ */ H((e) => e.toUpperCase());
}
// @__NO_SIDE_EFFECTS__
function wo() {
  return /* @__PURE__ */ H((e) => St(e));
}
// @__NO_SIDE_EFFECTS__
function zo(e, t, n) {
  return new e({
    type: "array",
    element: t,
    // get element() {
    //   return element;
    // },
    ...h(n)
  });
}
// @__NO_SIDE_EFFECTS__
function ko(e, t, n) {
  return new e({
    type: "custom",
    check: "custom",
    fn: t,
    ...h(n)
  });
}
// @__NO_SIDE_EFFECTS__
function $o(e) {
  const t = /* @__PURE__ */ Zo((n) => (n.addIssue = (r) => {
    if (typeof r == "string")
      n.issues.push(B(r, n.value, t._zod.def));
    else {
      const o = r;
      o.fatal && (o.continue = !1), o.code ?? (o.code = "custom"), o.input ?? (o.input = n.value), o.inst ?? (o.inst = t), o.continue ?? (o.continue = !t._zod.def.abort), n.issues.push(B(o));
    }
  }, e(n.value, n)));
  return t;
}
// @__NO_SIDE_EFFECTS__
function Zo(e, t) {
  const n = new S({
    check: "custom",
    ...h(t)
  });
  return n._zod.check = e, n;
}
function lt(e) {
  let t = e?.target ?? "draft-2020-12";
  return t === "draft-4" && (t = "draft-04"), t === "draft-7" && (t = "draft-07"), {
    processors: e.processors ?? {},
    metadataRegistry: e?.metadata ?? V,
    target: t,
    unrepresentable: e?.unrepresentable ?? "throw",
    override: e?.override ?? (() => {
    }),
    io: e?.io ?? "output",
    counter: 0,
    seen: /* @__PURE__ */ new Map(),
    cycles: e?.cycles ?? "ref",
    reused: e?.reused ?? "inline",
    external: e?.external ?? void 0
  };
}
function w(e, t, n = { path: [], schemaPath: [] }) {
  var r;
  const o = e._zod.def, i = t.seen.get(e);
  if (i)
    return i.count++, n.schemaPath.includes(e) && (i.cycle = n.path), i.schema;
  const s = { schema: {}, count: 1, cycle: void 0, path: n.path };
  t.seen.set(e, s);
  const c = e._zod.toJSONSchema?.();
  if (c)
    s.schema = c;
  else {
    const f = {
      ...n,
      schemaPath: [...n.schemaPath, e],
      path: n.path
    };
    if (e._zod.processJSONSchema)
      e._zod.processJSONSchema(t, s.schema, f);
    else {
      const p = s.schema, m = t.processors[o.type];
      if (!m)
        throw new Error(`[toJSONSchema]: Non-representable type encountered: ${o.type}`);
      m(e, t, p, f);
    }
    const d = e._zod.parent;
    d && (s.ref || (s.ref = d), w(d, t, f), t.seen.get(d).isParent = !0);
  }
  const a = t.metadataRegistry.get(e);
  return a && Object.assign(s.schema, a), t.io === "input" && $(e) && (delete s.schema.examples, delete s.schema.default), t.io === "input" && s.schema._prefault && ((r = s.schema).default ?? (r.default = s.schema._prefault)), delete s.schema._prefault, t.seen.get(e).schema;
}
function ft(e, t) {
  const n = e.seen.get(t);
  if (!n)
    throw new Error("Unprocessed schema. This is a bug in Zod.");
  const r = /* @__PURE__ */ new Map();
  for (const s of e.seen.entries()) {
    const c = e.metadataRegistry.get(s[0])?.id;
    if (c) {
      const a = r.get(c);
      if (a && a !== s[0])
        throw new Error(`Duplicate schema id "${c}" detected during JSON Schema conversion. Two different schemas cannot share the same id when converted together.`);
      r.set(c, s[0]);
    }
  }
  const o = (s) => {
    const c = e.target === "draft-2020-12" ? "$defs" : "definitions";
    if (e.external) {
      const d = e.external.registry.get(s[0])?.id, p = e.external.uri ?? ((k) => k);
      if (d)
        return { ref: p(d) };
      const m = s[1].defId ?? s[1].schema.id ?? `schema${e.counter++}`;
      return s[1].defId = m, { defId: m, ref: `${p("__shared")}#/${c}/${m}` };
    }
    if (s[1] === n)
      return { ref: "#" };
    const l = `#/${c}/`, f = s[1].schema.id ?? `__schema${e.counter++}`;
    return { defId: f, ref: l + f };
  }, i = (s) => {
    if (s[1].schema.$ref)
      return;
    const c = s[1], { ref: a, defId: l } = o(s);
    c.def = { ...c.schema }, l && (c.defId = l);
    const f = c.schema;
    for (const d in f)
      delete f[d];
    f.$ref = a;
  };
  if (e.cycles === "throw")
    for (const s of e.seen.entries()) {
      const c = s[1];
      if (c.cycle)
        throw new Error(`Cycle detected: #/${c.cycle?.join("/")}/<root>

Set the \`cycles\` parameter to \`"ref"\` to resolve cyclical schemas with defs.`);
    }
  for (const s of e.seen.entries()) {
    const c = s[1];
    if (t === s[0]) {
      i(s);
      continue;
    }
    if (e.external) {
      const l = e.external.registry.get(s[0])?.id;
      if (t !== s[0] && l) {
        i(s);
        continue;
      }
    }
    if (e.metadataRegistry.get(s[0])?.id) {
      i(s);
      continue;
    }
    if (c.cycle) {
      i(s);
      continue;
    }
    if (c.count > 1 && e.reused === "ref") {
      i(s);
      continue;
    }
  }
}
function dt(e, t) {
  const n = e.seen.get(t);
  if (!n)
    throw new Error("Unprocessed schema. This is a bug in Zod.");
  const r = (s) => {
    const c = e.seen.get(s);
    if (c.ref === null)
      return;
    const a = c.def ?? c.schema, l = { ...a }, f = c.ref;
    if (c.ref = null, f) {
      r(f);
      const p = e.seen.get(f), m = p.schema;
      if (m.$ref && (e.target === "draft-07" || e.target === "draft-04" || e.target === "openapi-3.0") ? (a.allOf = a.allOf ?? [], a.allOf.push(m)) : Object.assign(a, m), Object.assign(a, l), s._zod.parent === f)
        for (const z in a)
          z === "$ref" || z === "allOf" || z in l || delete a[z];
      if (m.$ref && p.def)
        for (const z in a)
          z === "$ref" || z === "allOf" || z in p.def && JSON.stringify(a[z]) === JSON.stringify(p.def[z]) && delete a[z];
    }
    const d = s._zod.parent;
    if (d && d !== f) {
      r(d);
      const p = e.seen.get(d);
      if (p?.schema.$ref && (a.$ref = p.schema.$ref, p.def))
        for (const m in a)
          m === "$ref" || m === "allOf" || m in p.def && JSON.stringify(a[m]) === JSON.stringify(p.def[m]) && delete a[m];
    }
    e.override({
      zodSchema: s,
      jsonSchema: a,
      path: c.path ?? []
    });
  };
  for (const s of [...e.seen.entries()].reverse())
    r(s[0]);
  const o = {};
  if (e.target === "draft-2020-12" ? o.$schema = "https://json-schema.org/draft/2020-12/schema" : e.target === "draft-07" ? o.$schema = "http://json-schema.org/draft-07/schema#" : e.target === "draft-04" ? o.$schema = "http://json-schema.org/draft-04/schema#" : e.target, e.external?.uri) {
    const s = e.external.registry.get(t)?.id;
    if (!s)
      throw new Error("Schema is missing an `id` property");
    o.$id = e.external.uri(s);
  }
  Object.assign(o, n.def ?? n.schema);
  const i = e.external?.defs ?? {};
  for (const s of e.seen.entries()) {
    const c = s[1];
    c.def && c.defId && (i[c.defId] = c.def);
  }
  e.external || Object.keys(i).length > 0 && (e.target === "draft-2020-12" ? o.$defs = i : o.definitions = i);
  try {
    const s = JSON.parse(JSON.stringify(o));
    return Object.defineProperty(s, "~standard", {
      value: {
        ...t["~standard"],
        jsonSchema: {
          input: te(t, "input", e.processors),
          output: te(t, "output", e.processors)
        }
      },
      enumerable: !1,
      writable: !1
    }), s;
  } catch {
    throw new Error("Error converting schema to JSON.");
  }
}
function $(e, t) {
  const n = t ?? { seen: /* @__PURE__ */ new Set() };
  if (n.seen.has(e))
    return !1;
  n.seen.add(e);
  const r = e._zod.def;
  if (r.type === "transform")
    return !0;
  if (r.type === "array")
    return $(r.element, n);
  if (r.type === "set")
    return $(r.valueType, n);
  if (r.type === "lazy")
    return $(r.getter(), n);
  if (r.type === "promise" || r.type === "optional" || r.type === "nonoptional" || r.type === "nullable" || r.type === "readonly" || r.type === "default" || r.type === "prefault")
    return $(r.innerType, n);
  if (r.type === "intersection")
    return $(r.left, n) || $(r.right, n);
  if (r.type === "record" || r.type === "map")
    return $(r.keyType, n) || $(r.valueType, n);
  if (r.type === "pipe")
    return $(r.in, n) || $(r.out, n);
  if (r.type === "object") {
    for (const o in r.shape)
      if ($(r.shape[o], n))
        return !0;
    return !1;
  }
  if (r.type === "union") {
    for (const o of r.options)
      if ($(o, n))
        return !0;
    return !1;
  }
  if (r.type === "tuple") {
    for (const o of r.items)
      if ($(o, n))
        return !0;
    return !!(r.rest && $(r.rest, n));
  }
  return !1;
}
const So = (e, t = {}) => (n) => {
  const r = lt({ ...n, processors: t });
  return w(e, r), ft(r, e), dt(r, e);
}, te = (e, t, n = {}) => (r) => {
  const { libraryOptions: o, target: i } = r ?? {}, s = lt({ ...o ?? {}, target: i, io: t, processors: n });
  return w(e, s), ft(s, e), dt(s, e);
}, Eo = {
  guid: "uuid",
  url: "uri",
  datetime: "date-time",
  json_string: "json-string",
  regex: ""
  // do not set
}, Oo = (e, t, n, r) => {
  const o = n;
  o.type = "string";
  const { minimum: i, maximum: s, format: c, patterns: a, contentEncoding: l } = e._zod.bag;
  if (typeof i == "number" && (o.minLength = i), typeof s == "number" && (o.maxLength = s), c && (o.format = Eo[c] ?? c, o.format === "" && delete o.format, c === "time" && delete o.format), l && (o.contentEncoding = l), a && a.size > 0) {
    const f = [...a];
    f.length === 1 ? o.pattern = f[0].source : f.length > 1 && (o.allOf = [
      ...f.map((d) => ({
        ...t.target === "draft-07" || t.target === "draft-04" || t.target === "openapi-3.0" ? { type: "string" } : {},
        pattern: d.source
      }))
    ]);
  }
}, Io = (e, t, n, r) => {
  const o = n, { minimum: i, maximum: s, format: c, multipleOf: a, exclusiveMaximum: l, exclusiveMinimum: f } = e._zod.bag;
  typeof c == "string" && c.includes("int") ? o.type = "integer" : o.type = "number", typeof f == "number" && (t.target === "draft-04" || t.target === "openapi-3.0" ? (o.minimum = f, o.exclusiveMinimum = !0) : o.exclusiveMinimum = f), typeof i == "number" && (o.minimum = i, typeof f == "number" && t.target !== "draft-04" && (f >= i ? delete o.minimum : delete o.exclusiveMinimum)), typeof l == "number" && (t.target === "draft-04" || t.target === "openapi-3.0" ? (o.maximum = l, o.exclusiveMaximum = !0) : o.exclusiveMaximum = l), typeof s == "number" && (o.maximum = s, typeof l == "number" && t.target !== "draft-04" && (l <= s ? delete o.maximum : delete o.exclusiveMaximum)), typeof a == "number" && (o.multipleOf = a);
}, No = (e, t, n, r) => {
  n.type = "boolean";
}, To = (e, t, n, r) => {
  n.not = {};
}, Ao = (e, t, n, r) => {
}, Po = (e, t, n, r) => {
}, Do = (e, t, n, r) => {
  const o = e._zod.def, i = Je(o.entries);
  i.every((s) => typeof s == "number") && (n.type = "number"), i.every((s) => typeof s == "string") && (n.type = "string"), n.enum = i;
}, Ro = (e, t, n, r) => {
  const o = e._zod.def, i = [];
  for (const s of o.values)
    if (s === void 0) {
      if (t.unrepresentable === "throw")
        throw new Error("Literal `undefined` cannot be represented in JSON Schema");
    } else if (typeof s == "bigint") {
      if (t.unrepresentable === "throw")
        throw new Error("BigInt literals cannot be represented in JSON Schema");
      i.push(Number(s));
    } else
      i.push(s);
  if (i.length !== 0) if (i.length === 1) {
    const s = i[0];
    n.type = s === null ? "null" : typeof s, t.target === "draft-04" || t.target === "openapi-3.0" ? n.enum = [s] : n.const = s;
  } else
    i.every((s) => typeof s == "number") && (n.type = "number"), i.every((s) => typeof s == "string") && (n.type = "string"), i.every((s) => typeof s == "boolean") && (n.type = "boolean"), i.every((s) => s === null) && (n.type = "null"), n.enum = i;
}, Co = (e, t, n, r) => {
  if (t.unrepresentable === "throw")
    throw new Error("Custom types cannot be represented in JSON Schema");
}, jo = (e, t, n, r) => {
  if (t.unrepresentable === "throw")
    throw new Error("Transforms cannot be represented in JSON Schema");
}, Mo = (e, t, n, r) => {
  const o = n, i = e._zod.def, { minimum: s, maximum: c } = e._zod.bag;
  typeof s == "number" && (o.minItems = s), typeof c == "number" && (o.maxItems = c), o.type = "array", o.items = w(i.element, t, { ...r, path: [...r.path, "items"] });
}, xo = (e, t, n, r) => {
  const o = n, i = e._zod.def;
  o.type = "object", o.properties = {};
  const s = i.shape;
  for (const l in s)
    o.properties[l] = w(s[l], t, {
      ...r,
      path: [...r.path, "properties", l]
    });
  const c = new Set(Object.keys(s)), a = new Set([...c].filter((l) => {
    const f = i.shape[l]._zod;
    return t.io === "input" ? f.optin === void 0 : f.optout === void 0;
  }));
  a.size > 0 && (o.required = Array.from(a)), i.catchall?._zod.def.type === "never" ? o.additionalProperties = !1 : i.catchall ? i.catchall && (o.additionalProperties = w(i.catchall, t, {
    ...r,
    path: [...r.path, "additionalProperties"]
  })) : t.io === "output" && (o.additionalProperties = !1);
}, Uo = (e, t, n, r) => {
  const o = e._zod.def, i = o.inclusive === !1, s = o.options.map((c, a) => w(c, t, {
    ...r,
    path: [...r.path, i ? "oneOf" : "anyOf", a]
  }));
  i ? n.oneOf = s : n.anyOf = s;
}, Fo = (e, t, n, r) => {
  const o = e._zod.def, i = w(o.left, t, {
    ...r,
    path: [...r.path, "allOf", 0]
  }), s = w(o.right, t, {
    ...r,
    path: [...r.path, "allOf", 1]
  }), c = (l) => "allOf" in l && Object.keys(l).length === 1, a = [
    ...c(i) ? i.allOf : [i],
    ...c(s) ? s.allOf : [s]
  ];
  n.allOf = a;
}, Lo = (e, t, n, r) => {
  const o = n, i = e._zod.def;
  o.type = "object";
  const s = i.keyType, a = s._zod.bag?.patterns;
  if (i.mode === "loose" && a && a.size > 0) {
    const f = w(i.valueType, t, {
      ...r,
      path: [...r.path, "patternProperties", "*"]
    });
    o.patternProperties = {};
    for (const d of a)
      o.patternProperties[d.source] = f;
  } else
    (t.target === "draft-07" || t.target === "draft-2020-12") && (o.propertyNames = w(i.keyType, t, {
      ...r,
      path: [...r.path, "propertyNames"]
    })), o.additionalProperties = w(i.valueType, t, {
      ...r,
      path: [...r.path, "additionalProperties"]
    });
  const l = s._zod.values;
  if (l) {
    const f = [...l].filter((d) => typeof d == "string" || typeof d == "number");
    f.length > 0 && (o.required = f);
  }
}, Jo = (e, t, n, r) => {
  const o = e._zod.def, i = w(o.innerType, t, r), s = t.seen.get(e);
  t.target === "openapi-3.0" ? (s.ref = o.innerType, n.nullable = !0) : n.anyOf = [i, { type: "null" }];
}, Ho = (e, t, n, r) => {
  const o = e._zod.def;
  w(o.innerType, t, r);
  const i = t.seen.get(e);
  i.ref = o.innerType;
}, Vo = (e, t, n, r) => {
  const o = e._zod.def;
  w(o.innerType, t, r);
  const i = t.seen.get(e);
  i.ref = o.innerType, n.default = JSON.parse(JSON.stringify(o.defaultValue));
}, Wo = (e, t, n, r) => {
  const o = e._zod.def;
  w(o.innerType, t, r);
  const i = t.seen.get(e);
  i.ref = o.innerType, t.io === "input" && (n._prefault = JSON.parse(JSON.stringify(o.defaultValue)));
}, Bo = (e, t, n, r) => {
  const o = e._zod.def;
  w(o.innerType, t, r);
  const i = t.seen.get(e);
  i.ref = o.innerType;
  let s;
  try {
    s = o.catchValue(void 0);
  } catch {
    throw new Error("Dynamic catch values are not supported in JSON Schema");
  }
  n.default = s;
}, Ko = (e, t, n, r) => {
  const o = e._zod.def, i = t.io === "input" ? o.in._zod.def.type === "transform" ? o.out : o.in : o.out;
  w(i, t, r);
  const s = t.seen.get(e);
  s.ref = i;
}, Go = (e, t, n, r) => {
  const o = e._zod.def;
  w(o.innerType, t, r);
  const i = t.seen.get(e);
  i.ref = o.innerType, n.readOnly = !0;
}, ht = (e, t, n, r) => {
  const o = e._zod.def;
  w(o.innerType, t, r);
  const i = t.seen.get(e);
  i.ref = o.innerType;
}, Yo = /* @__PURE__ */ u("ZodISODateTime", (e, t) => {
  Bn.init(e, t), b.init(e, t);
});
function qo(e) {
  return /* @__PURE__ */ eo(Yo, e);
}
const Qo = /* @__PURE__ */ u("ZodISODate", (e, t) => {
  Kn.init(e, t), b.init(e, t);
});
function Xo(e) {
  return /* @__PURE__ */ to(Qo, e);
}
const es = /* @__PURE__ */ u("ZodISOTime", (e, t) => {
  Gn.init(e, t), b.init(e, t);
});
function ts(e) {
  return /* @__PURE__ */ no(es, e);
}
const ns = /* @__PURE__ */ u("ZodISODuration", (e, t) => {
  Yn.init(e, t), b.init(e, t);
});
function rs(e) {
  return /* @__PURE__ */ ro(ns, e);
}
const os = (e, t) => {
  Be.init(e, t), e.name = "ZodError", Object.defineProperties(e, {
    format: {
      value: (n) => xt(e, n)
      // enumerable: false,
    },
    flatten: {
      value: (n) => Mt(e, n)
      // enumerable: false,
    },
    addIssue: {
      value: (n) => {
        e.issues.push(n), e.message = JSON.stringify(e.issues, ue, 2);
      }
      // enumerable: false,
    },
    addIssues: {
      value: (n) => {
        e.issues.push(...n), e.message = JSON.stringify(e.issues, ue, 2);
      }
      // enumerable: false,
    },
    isEmpty: {
      get() {
        return e.issues.length === 0;
      }
      // enumerable: false,
    }
  });
}, I = u("ZodError", os, {
  Parent: Error
}), ss = /* @__PURE__ */ ge(I), is = /* @__PURE__ */ _e(I), cs = /* @__PURE__ */ re(I), as = /* @__PURE__ */ oe(I), us = /* @__PURE__ */ Lt(I), ls = /* @__PURE__ */ Jt(I), fs = /* @__PURE__ */ Ht(I), ds = /* @__PURE__ */ Vt(I), hs = /* @__PURE__ */ Wt(I), ps = /* @__PURE__ */ Bt(I), ms = /* @__PURE__ */ Kt(I), gs = /* @__PURE__ */ Gt(I), y = /* @__PURE__ */ u("ZodType", (e, t) => (_.init(e, t), Object.assign(e["~standard"], {
  jsonSchema: {
    input: te(e, "input"),
    output: te(e, "output")
  }
}), e.toJSONSchema = So(e, {}), e.def = t, e.type = t.type, Object.defineProperty(e, "_def", { value: t }), e.check = (...n) => e.clone(R(t, {
  checks: [
    ...t.checks ?? [],
    ...n.map((r) => typeof r == "function" ? { _zod: { check: r, def: { check: "custom" }, onattach: [] } } : r)
  ]
}), {
  parent: !0
}), e.with = e.check, e.clone = (n, r) => C(e, n, r), e.brand = () => e, e.register = ((n, r) => (n.add(e, r), e)), e.parse = (n, r) => ss(e, n, r, { callee: e.parse }), e.safeParse = (n, r) => cs(e, n, r), e.parseAsync = async (n, r) => is(e, n, r, { callee: e.parseAsync }), e.safeParseAsync = async (n, r) => as(e, n, r), e.spa = e.safeParseAsync, e.encode = (n, r) => us(e, n, r), e.decode = (n, r) => ls(e, n, r), e.encodeAsync = async (n, r) => fs(e, n, r), e.decodeAsync = async (n, r) => ds(e, n, r), e.safeEncode = (n, r) => hs(e, n, r), e.safeDecode = (n, r) => ps(e, n, r), e.safeEncodeAsync = async (n, r) => ms(e, n, r), e.safeDecodeAsync = async (n, r) => gs(e, n, r), e.refine = (n, r) => e.check(mi(n, r)), e.superRefine = (n) => e.check(gi(n)), e.overwrite = (n) => e.check(/* @__PURE__ */ H(n)), e.optional = () => Me(e), e.exactOptional = () => ni(e), e.nullable = () => xe(e), e.nullish = () => Me(xe(e)), e.nonoptional = (n) => ai(e, n), e.array = () => Hs(e), e.or = (n) => Ws([e, n]), e.and = (n) => Gs(e, n), e.transform = (n) => Ue(e, ei(n)), e.default = (n) => si(e, n), e.prefault = (n) => ci(e, n), e.catch = (n) => li(e, n), e.pipe = (n) => Ue(e, n), e.readonly = () => hi(e), e.describe = (n) => {
  const r = e.clone();
  return V.add(r, { description: n }), r;
}, Object.defineProperty(e, "description", {
  get() {
    return V.get(e)?.description;
  },
  configurable: !0
}), e.meta = (...n) => {
  if (n.length === 0)
    return V.get(e);
  const r = e.clone();
  return V.add(r, n[0]), r;
}, e.isOptional = () => e.safeParse(void 0).success, e.isNullable = () => e.safeParse(null).success, e.apply = (n) => n(e), e)), pt = /* @__PURE__ */ u("_ZodString", (e, t) => {
  ve.init(e, t), y.init(e, t), e._zod.processJSONSchema = (r, o, i) => Oo(e, r, o);
  const n = e._zod.bag;
  e.format = n.format ?? null, e.minLength = n.minimum ?? null, e.maxLength = n.maximum ?? null, e.regex = (...r) => e.check(/* @__PURE__ */ lo(...r)), e.includes = (...r) => e.check(/* @__PURE__ */ po(...r)), e.startsWith = (...r) => e.check(/* @__PURE__ */ mo(...r)), e.endsWith = (...r) => e.check(/* @__PURE__ */ go(...r)), e.min = (...r) => e.check(/* @__PURE__ */ ee(...r)), e.max = (...r) => e.check(/* @__PURE__ */ at(...r)), e.length = (...r) => e.check(/* @__PURE__ */ ut(...r)), e.nonempty = (...r) => e.check(/* @__PURE__ */ ee(1, ...r)), e.lowercase = (r) => e.check(/* @__PURE__ */ fo(r)), e.uppercase = (r) => e.check(/* @__PURE__ */ ho(r)), e.trim = () => e.check(/* @__PURE__ */ vo()), e.normalize = (...r) => e.check(/* @__PURE__ */ _o(...r)), e.toLowerCase = () => e.check(/* @__PURE__ */ yo()), e.toUpperCase = () => e.check(/* @__PURE__ */ bo()), e.slugify = () => e.check(/* @__PURE__ */ wo());
}), _s = /* @__PURE__ */ u("ZodString", (e, t) => {
  ve.init(e, t), pt.init(e, t), e.email = (n) => e.check(/* @__PURE__ */ Pr(vs, n)), e.url = (n) => e.check(/* @__PURE__ */ Mr(ys, n)), e.jwt = (n) => e.check(/* @__PURE__ */ Xr(Ds, n)), e.emoji = (n) => e.check(/* @__PURE__ */ xr(bs, n)), e.guid = (n) => e.check(/* @__PURE__ */ Te(Re, n)), e.uuid = (n) => e.check(/* @__PURE__ */ Dr(q, n)), e.uuidv4 = (n) => e.check(/* @__PURE__ */ Rr(q, n)), e.uuidv6 = (n) => e.check(/* @__PURE__ */ Cr(q, n)), e.uuidv7 = (n) => e.check(/* @__PURE__ */ jr(q, n)), e.nanoid = (n) => e.check(/* @__PURE__ */ Ur(ws, n)), e.guid = (n) => e.check(/* @__PURE__ */ Te(Re, n)), e.cuid = (n) => e.check(/* @__PURE__ */ Fr(zs, n)), e.cuid2 = (n) => e.check(/* @__PURE__ */ Lr(ks, n)), e.ulid = (n) => e.check(/* @__PURE__ */ Jr($s, n)), e.base64 = (n) => e.check(/* @__PURE__ */ Yr(Ts, n)), e.base64url = (n) => e.check(/* @__PURE__ */ qr(As, n)), e.xid = (n) => e.check(/* @__PURE__ */ Hr(Zs, n)), e.ksuid = (n) => e.check(/* @__PURE__ */ Vr(Ss, n)), e.ipv4 = (n) => e.check(/* @__PURE__ */ Wr(Es, n)), e.ipv6 = (n) => e.check(/* @__PURE__ */ Br(Os, n)), e.cidrv4 = (n) => e.check(/* @__PURE__ */ Kr(Is, n)), e.cidrv6 = (n) => e.check(/* @__PURE__ */ Gr(Ns, n)), e.e164 = (n) => e.check(/* @__PURE__ */ Qr(Ps, n)), e.datetime = (n) => e.check(qo(n)), e.date = (n) => e.check(Xo(n)), e.time = (n) => e.check(ts(n)), e.duration = (n) => e.check(rs(n));
});
function O(e) {
  return /* @__PURE__ */ Ar(_s, e);
}
const b = /* @__PURE__ */ u("ZodStringFormat", (e, t) => {
  v.init(e, t), pt.init(e, t);
}), vs = /* @__PURE__ */ u("ZodEmail", (e, t) => {
  Mn.init(e, t), b.init(e, t);
}), Re = /* @__PURE__ */ u("ZodGUID", (e, t) => {
  Cn.init(e, t), b.init(e, t);
}), q = /* @__PURE__ */ u("ZodUUID", (e, t) => {
  jn.init(e, t), b.init(e, t);
}), ys = /* @__PURE__ */ u("ZodURL", (e, t) => {
  xn.init(e, t), b.init(e, t);
}), bs = /* @__PURE__ */ u("ZodEmoji", (e, t) => {
  Un.init(e, t), b.init(e, t);
}), ws = /* @__PURE__ */ u("ZodNanoID", (e, t) => {
  Fn.init(e, t), b.init(e, t);
}), zs = /* @__PURE__ */ u("ZodCUID", (e, t) => {
  Ln.init(e, t), b.init(e, t);
}), ks = /* @__PURE__ */ u("ZodCUID2", (e, t) => {
  Jn.init(e, t), b.init(e, t);
}), $s = /* @__PURE__ */ u("ZodULID", (e, t) => {
  Hn.init(e, t), b.init(e, t);
}), Zs = /* @__PURE__ */ u("ZodXID", (e, t) => {
  Vn.init(e, t), b.init(e, t);
}), Ss = /* @__PURE__ */ u("ZodKSUID", (e, t) => {
  Wn.init(e, t), b.init(e, t);
}), Es = /* @__PURE__ */ u("ZodIPv4", (e, t) => {
  qn.init(e, t), b.init(e, t);
}), Os = /* @__PURE__ */ u("ZodIPv6", (e, t) => {
  Qn.init(e, t), b.init(e, t);
}), Is = /* @__PURE__ */ u("ZodCIDRv4", (e, t) => {
  Xn.init(e, t), b.init(e, t);
}), Ns = /* @__PURE__ */ u("ZodCIDRv6", (e, t) => {
  er.init(e, t), b.init(e, t);
}), Ts = /* @__PURE__ */ u("ZodBase64", (e, t) => {
  tr.init(e, t), b.init(e, t);
}), As = /* @__PURE__ */ u("ZodBase64URL", (e, t) => {
  rr.init(e, t), b.init(e, t);
}), Ps = /* @__PURE__ */ u("ZodE164", (e, t) => {
  or.init(e, t), b.init(e, t);
}), Ds = /* @__PURE__ */ u("ZodJWT", (e, t) => {
  ir.init(e, t), b.init(e, t);
}), mt = /* @__PURE__ */ u("ZodNumber", (e, t) => {
  rt.init(e, t), y.init(e, t), e._zod.processJSONSchema = (r, o, i) => Io(e, r, o), e.gt = (r, o) => e.check(/* @__PURE__ */ Pe(r, o)), e.gte = (r, o) => e.check(/* @__PURE__ */ ce(r, o)), e.min = (r, o) => e.check(/* @__PURE__ */ ce(r, o)), e.lt = (r, o) => e.check(/* @__PURE__ */ Ae(r, o)), e.lte = (r, o) => e.check(/* @__PURE__ */ ie(r, o)), e.max = (r, o) => e.check(/* @__PURE__ */ ie(r, o)), e.int = (r) => e.check(Ce(r)), e.safe = (r) => e.check(Ce(r)), e.positive = (r) => e.check(/* @__PURE__ */ Pe(0, r)), e.nonnegative = (r) => e.check(/* @__PURE__ */ ce(0, r)), e.negative = (r) => e.check(/* @__PURE__ */ Ae(0, r)), e.nonpositive = (r) => e.check(/* @__PURE__ */ ie(0, r)), e.multipleOf = (r, o) => e.check(/* @__PURE__ */ De(r, o)), e.step = (r, o) => e.check(/* @__PURE__ */ De(r, o)), e.finite = () => e;
  const n = e._zod.bag;
  e.minValue = Math.max(n.minimum ?? Number.NEGATIVE_INFINITY, n.exclusiveMinimum ?? Number.NEGATIVE_INFINITY) ?? null, e.maxValue = Math.min(n.maximum ?? Number.POSITIVE_INFINITY, n.exclusiveMaximum ?? Number.POSITIVE_INFINITY) ?? null, e.isInt = (n.format ?? "").includes("int") || Number.isSafeInteger(n.multipleOf ?? 0.5), e.isFinite = !0, e.format = n.format ?? null;
});
function fe(e) {
  return /* @__PURE__ */ oo(mt, e);
}
const Rs = /* @__PURE__ */ u("ZodNumberFormat", (e, t) => {
  cr.init(e, t), mt.init(e, t);
});
function Ce(e) {
  return /* @__PURE__ */ so(Rs, e);
}
const Cs = /* @__PURE__ */ u("ZodBoolean", (e, t) => {
  ar.init(e, t), y.init(e, t), e._zod.processJSONSchema = (n, r, o) => No(e, n, r);
});
function js(e) {
  return /* @__PURE__ */ io(Cs, e);
}
const Ms = /* @__PURE__ */ u("ZodAny", (e, t) => {
  ur.init(e, t), y.init(e, t), e._zod.processJSONSchema = (n, r, o) => Ao();
});
function xs() {
  return /* @__PURE__ */ co(Ms);
}
const Us = /* @__PURE__ */ u("ZodUnknown", (e, t) => {
  lr.init(e, t), y.init(e, t), e._zod.processJSONSchema = (n, r, o) => Po();
});
function je() {
  return /* @__PURE__ */ ao(Us);
}
const Fs = /* @__PURE__ */ u("ZodNever", (e, t) => {
  fr.init(e, t), y.init(e, t), e._zod.processJSONSchema = (n, r, o) => To(e, n, r);
});
function Ls(e) {
  return /* @__PURE__ */ uo(Fs, e);
}
const Js = /* @__PURE__ */ u("ZodArray", (e, t) => {
  dr.init(e, t), y.init(e, t), e._zod.processJSONSchema = (n, r, o) => Mo(e, n, r, o), e.element = t.element, e.min = (n, r) => e.check(/* @__PURE__ */ ee(n, r)), e.nonempty = (n) => e.check(/* @__PURE__ */ ee(1, n)), e.max = (n, r) => e.check(/* @__PURE__ */ at(n, r)), e.length = (n, r) => e.check(/* @__PURE__ */ ut(n, r)), e.unwrap = () => e.element;
});
function Hs(e, t) {
  return /* @__PURE__ */ zo(Js, e, t);
}
const Vs = /* @__PURE__ */ u("ZodObject", (e, t) => {
  pr.init(e, t), y.init(e, t), e._zod.processJSONSchema = (n, r, o) => xo(e, n, r, o), g(e, "shape", () => t.shape), e.keyof = () => vt(Object.keys(e._zod.def.shape)), e.catchall = (n) => e.clone({ ...e._zod.def, catchall: n }), e.passthrough = () => e.clone({ ...e._zod.def, catchall: je() }), e.loose = () => e.clone({ ...e._zod.def, catchall: je() }), e.strict = () => e.clone({ ...e._zod.def, catchall: Ls() }), e.strip = () => e.clone({ ...e._zod.def, catchall: void 0 }), e.extend = (n) => Pt(e, n), e.safeExtend = (n) => Dt(e, n), e.merge = (n) => Rt(e, n), e.pick = (n) => Tt(e, n), e.omit = (n) => At(e, n), e.partial = (...n) => Ct(yt, e, n[0]), e.required = (...n) => jt(bt, e, n[0]);
});
function E(e, t) {
  const n = {
    type: "object",
    shape: e ?? {},
    ...h(t)
  };
  return new Vs(n);
}
const gt = /* @__PURE__ */ u("ZodUnion", (e, t) => {
  it.init(e, t), y.init(e, t), e._zod.processJSONSchema = (n, r, o) => Uo(e, n, r, o), e.options = t.options;
});
function Ws(e, t) {
  return new gt({
    type: "union",
    options: e,
    ...h(t)
  });
}
const Bs = /* @__PURE__ */ u("ZodDiscriminatedUnion", (e, t) => {
  gt.init(e, t), mr.init(e, t);
});
function _t(e, t, n) {
  return new Bs({
    type: "union",
    options: t,
    discriminator: e,
    ...h(n)
  });
}
const Ks = /* @__PURE__ */ u("ZodIntersection", (e, t) => {
  gr.init(e, t), y.init(e, t), e._zod.processJSONSchema = (n, r, o) => Fo(e, n, r, o);
});
function Gs(e, t) {
  return new Ks({
    type: "intersection",
    left: e,
    right: t
  });
}
const Ys = /* @__PURE__ */ u("ZodRecord", (e, t) => {
  _r.init(e, t), y.init(e, t), e._zod.processJSONSchema = (n, r, o) => Lo(e, n, r, o), e.keyType = t.keyType, e.valueType = t.valueType;
});
function qs(e, t, n) {
  return new Ys({
    type: "record",
    keyType: e,
    valueType: t,
    ...h(n)
  });
}
const de = /* @__PURE__ */ u("ZodEnum", (e, t) => {
  vr.init(e, t), y.init(e, t), e._zod.processJSONSchema = (r, o, i) => Do(e, r, o), e.enum = t.entries, e.options = Object.values(t.entries);
  const n = new Set(Object.keys(t.entries));
  e.extract = (r, o) => {
    const i = {};
    for (const s of r)
      if (n.has(s))
        i[s] = t.entries[s];
      else
        throw new Error(`Key ${s} not found in enum`);
    return new de({
      ...t,
      checks: [],
      ...h(o),
      entries: i
    });
  }, e.exclude = (r, o) => {
    const i = { ...t.entries };
    for (const s of r)
      if (n.has(s))
        delete i[s];
      else
        throw new Error(`Key ${s} not found in enum`);
    return new de({
      ...t,
      checks: [],
      ...h(o),
      entries: i
    });
  };
});
function vt(e, t) {
  const n = Array.isArray(e) ? Object.fromEntries(e.map((r) => [r, r])) : e;
  return new de({
    type: "enum",
    entries: n,
    ...h(t)
  });
}
const Qs = /* @__PURE__ */ u("ZodLiteral", (e, t) => {
  yr.init(e, t), y.init(e, t), e._zod.processJSONSchema = (n, r, o) => Ro(e, n, r), e.values = new Set(t.values), Object.defineProperty(e, "value", {
    get() {
      if (t.values.length > 1)
        throw new Error("This schema contains multiple valid literal values. Use `.values` instead.");
      return t.values[0];
    }
  });
});
function j(e, t) {
  return new Qs({
    type: "literal",
    values: Array.isArray(e) ? e : [e],
    ...h(t)
  });
}
const Xs = /* @__PURE__ */ u("ZodTransform", (e, t) => {
  br.init(e, t), y.init(e, t), e._zod.processJSONSchema = (n, r, o) => jo(e, n), e._zod.parse = (n, r) => {
    if (r.direction === "backward")
      throw new Fe(e.constructor.name);
    n.addIssue = (i) => {
      if (typeof i == "string")
        n.issues.push(B(i, n.value, t));
      else {
        const s = i;
        s.fatal && (s.continue = !1), s.code ?? (s.code = "custom"), s.input ?? (s.input = n.value), s.inst ?? (s.inst = e), n.issues.push(B(s));
      }
    };
    const o = t.transform(n.value, n);
    return o instanceof Promise ? o.then((i) => (n.value = i, n)) : (n.value = o, n);
  };
});
function ei(e) {
  return new Xs({
    type: "transform",
    transform: e
  });
}
const yt = /* @__PURE__ */ u("ZodOptional", (e, t) => {
  ct.init(e, t), y.init(e, t), e._zod.processJSONSchema = (n, r, o) => ht(e, n, r, o), e.unwrap = () => e._zod.def.innerType;
});
function Me(e) {
  return new yt({
    type: "optional",
    innerType: e
  });
}
const ti = /* @__PURE__ */ u("ZodExactOptional", (e, t) => {
  wr.init(e, t), y.init(e, t), e._zod.processJSONSchema = (n, r, o) => ht(e, n, r, o), e.unwrap = () => e._zod.def.innerType;
});
function ni(e) {
  return new ti({
    type: "optional",
    innerType: e
  });
}
const ri = /* @__PURE__ */ u("ZodNullable", (e, t) => {
  zr.init(e, t), y.init(e, t), e._zod.processJSONSchema = (n, r, o) => Jo(e, n, r, o), e.unwrap = () => e._zod.def.innerType;
});
function xe(e) {
  return new ri({
    type: "nullable",
    innerType: e
  });
}
const oi = /* @__PURE__ */ u("ZodDefault", (e, t) => {
  kr.init(e, t), y.init(e, t), e._zod.processJSONSchema = (n, r, o) => Vo(e, n, r, o), e.unwrap = () => e._zod.def.innerType, e.removeDefault = e.unwrap;
});
function si(e, t) {
  return new oi({
    type: "default",
    innerType: e,
    get defaultValue() {
      return typeof t == "function" ? t() : Ve(t);
    }
  });
}
const ii = /* @__PURE__ */ u("ZodPrefault", (e, t) => {
  $r.init(e, t), y.init(e, t), e._zod.processJSONSchema = (n, r, o) => Wo(e, n, r, o), e.unwrap = () => e._zod.def.innerType;
});
function ci(e, t) {
  return new ii({
    type: "prefault",
    innerType: e,
    get defaultValue() {
      return typeof t == "function" ? t() : Ve(t);
    }
  });
}
const bt = /* @__PURE__ */ u("ZodNonOptional", (e, t) => {
  Zr.init(e, t), y.init(e, t), e._zod.processJSONSchema = (n, r, o) => Ho(e, n, r, o), e.unwrap = () => e._zod.def.innerType;
});
function ai(e, t) {
  return new bt({
    type: "nonoptional",
    innerType: e,
    ...h(t)
  });
}
const ui = /* @__PURE__ */ u("ZodCatch", (e, t) => {
  Sr.init(e, t), y.init(e, t), e._zod.processJSONSchema = (n, r, o) => Bo(e, n, r, o), e.unwrap = () => e._zod.def.innerType, e.removeCatch = e.unwrap;
});
function li(e, t) {
  return new ui({
    type: "catch",
    innerType: e,
    catchValue: typeof t == "function" ? t : () => t
  });
}
const fi = /* @__PURE__ */ u("ZodPipe", (e, t) => {
  Er.init(e, t), y.init(e, t), e._zod.processJSONSchema = (n, r, o) => Ko(e, n, r, o), e.in = t.in, e.out = t.out;
});
function Ue(e, t) {
  return new fi({
    type: "pipe",
    in: e,
    out: t
    // ...util.normalizeParams(params),
  });
}
const di = /* @__PURE__ */ u("ZodReadonly", (e, t) => {
  Or.init(e, t), y.init(e, t), e._zod.processJSONSchema = (n, r, o) => Go(e, n, r, o), e.unwrap = () => e._zod.def.innerType;
});
function hi(e) {
  return new di({
    type: "readonly",
    innerType: e
  });
}
const pi = /* @__PURE__ */ u("ZodCustom", (e, t) => {
  Ir.init(e, t), y.init(e, t), e._zod.processJSONSchema = (n, r, o) => Co(e, n);
});
function mi(e, t = {}) {
  return /* @__PURE__ */ ko(pi, e, t);
}
function gi(e) {
  return /* @__PURE__ */ $o(e);
}
const _i = E({
  text: O().min(1).max(1e4),
  sessionId: O().optional(),
  context: qs(O(), xs()).optional()
}), vi = E({
  messageId: O(),
  success: js(),
  content: O().optional(),
  error: O().optional(),
  metadata: E({
    model: O(),
    tokensUsed: fe(),
    duration: fe().optional()
  }).optional()
}), yi = _t("type", [
  E({
    type: j("init"),
    payload: E({
      sessionId: O().optional(),
      theme: vt(["light", "dark"]).optional(),
      locale: O().optional()
    })
  }),
  E({
    type: j("sendMessage"),
    payload: _i.extend({
      messageId: O()
    })
  }),
  E({
    type: j("disconnect")
  })
]), bi = _t("type", [
  E({
    type: j("ready")
  }),
  E({
    type: j("messageResponse"),
    payload: vi
  }),
  E({
    type: j("error"),
    payload: E({
      message: O(),
      code: O().optional()
    })
  }),
  E({
    type: j("heartbeatAck"),
    payload: E({
      timestamp: fe().optional()
    })
  })
]);
class wi {
  constructor(t) {
    this.messageQueue = /* @__PURE__ */ new Map(), this.messageId = 0, this.messageHandler = null, this.isListening = !1, this.config = t;
  }
  /**
   * 启动桥接器
   */
  start() {
    this.isListening || (this.messageHandler = this.handleMessage.bind(this), window.addEventListener("message", this.messageHandler), this.isListening = !0);
  }
  /**
   * 停止桥接器
   */
  stop() {
    this.isListening && (this.messageHandler && (window.removeEventListener("message", this.messageHandler), this.messageHandler = null), this.messageQueue.forEach(({ timeout: t, reject: n }) => {
      clearTimeout(t), n(new Error("Bridge stopped"));
    }), this.messageQueue.clear(), this.isListening = !1);
  }
  /**
   * 处理来自 iframe 的消息
   */
  handleMessage(t) {
    if (t.origin === this.config.targetOrigin)
      try {
        const n = bi.parse(t.data);
        if (this.config.onMessage(n), n.type === "messageResponse") {
          const r = this.messageQueue.get(n.payload.messageId);
          r && (clearTimeout(r.timeout), this.messageQueue.delete(n.payload.messageId), r.resolve(n));
        }
      } catch (n) {
        console.warn("[MessageBridge] Invalid message:", n);
      }
  }
  /**
   * 发送消息并等待响应
   */
  async sendAndWait(t, n = 3e4) {
    return new Promise((r, o) => {
      let i;
      t.type === "sendMessage" ? i = t.payload.messageId : i = `bridge_${Date.now()}_${this.messageId++}`;
      const s = setTimeout(() => {
        this.messageQueue.delete(i), o(new Error(`Message timeout: ${t.type}`));
      }, n);
      this.messageQueue.set(i, {
        resolve: r,
        reject: o,
        timeout: s
      }), this.send(t);
    });
  }
  /**
   * 发送消息(不等待响应)
   */
  send(t) {
    const n = this.config.getContentWindow();
    if (!n)
      return this.config.onError?.(new Error("Iframe not available")), !1;
    try {
      return yi.parse(t), n.postMessage(t, this.config.targetOrigin), !0;
    } catch (r) {
      return this.config.onError?.(r), !1;
    }
  }
  /**
   * 获取消息 ID(用于请求-响应匹配)
   */
  getMessageId(t) {
    return t.type === "sendMessage" ? t.payload.messageId : null;
  }
  /**
   * 获取待处理消息数量
   */
  getPendingCount() {
    return this.messageQueue.size;
  }
  /**
   * 是否正在监听
   */
  isActive() {
    return this.isListening;
  }
}
var Q = /* @__PURE__ */ ((e) => (e.CONNECTING = "connecting", e.CONNECTED = "connected", e.DISCONNECTED = "disconnected", e.ERROR = "error", e))(Q || {}), zi = /* @__PURE__ */ ((e) => (e.NETWORK = "network", e.TIMEOUT = "timeout", e.IFRAME_LOAD_FAILED = "iframe_load_failed", e.UNAUTHORIZED = "unauthorized", e.UNKNOWN = "unknown", e))(zi || {});
class ae extends Error {
  constructor(t, n, r = !0) {
    super(n), this.type = t, this.retryable = r, this.name = "ConnectionError";
  }
}
class ki {
  constructor(t, n, r) {
    this.state = "disconnected", this.listeners = /* @__PURE__ */ new Set(), this.heartbeatTimer = null, this.missedHeartbeats = 0, this.reconnectAttempts = 0, this.reconnectTimer = null, this.getContentWindow = t, this.targetOrigin = n, this.config = {
      heartbeatInterval: r?.heartbeatInterval ?? 5e3,
      maxMissedHeartbeats: r?.maxMissedHeartbeats ?? 3,
      reconnectDelay: r?.reconnectDelay ?? 1e3,
      maxReconnectAttempts: r?.maxReconnectAttempts ?? 5
    };
  }
  /**
   * 启动连接管理器
   */
  start() {
    this.setState(
      "connecting"
      /* CONNECTING */
    ), this.startHeartbeat();
  }
  /**
   * 停止连接管理器
   */
  stop() {
    this.stopHeartbeat(), this.stopReconnect(), this.setState(
      "disconnected"
      /* DISCONNECTED */
    );
  }
  /**
   * 添加事件监听器
   */
  on(t) {
    return this.listeners.add(t), () => this.listeners.delete(t);
  }
  /**
   * 发送心跳消息
   */
  sendHeartbeat() {
    const t = this.getContentWindow();
    if (!t) {
      this.handleMissedHeartbeat();
      return;
    }
    try {
      t.postMessage(
        { type: "heartbeat", timestamp: Date.now() },
        this.targetOrigin
      ), this.missedHeartbeats++, this.missedHeartbeats > this.config.maxMissedHeartbeats && this.handleDisconnection();
    } catch {
      this.handleMissedHeartbeat();
    }
  }
  /**
   * 处理心跳响应
   */
  handleHeartbeatAck() {
    this.missedHeartbeats = 0, this.state !== "connected" && (this.setState(
      "connected"
      /* CONNECTED */
    ), this.reconnectAttempts = 0), this.emit({ type: "heartbeat" });
  }
  /**
   * 处理丢失的心跳
   */
  handleMissedHeartbeat() {
    this.missedHeartbeats++, this.missedHeartbeats > this.config.maxMissedHeartbeats && this.handleDisconnection();
  }
  /**
   * 处理断开连接
   */
  handleDisconnection() {
    this.setState(
      "disconnected"
      /* DISCONNECTED */
    ), this.stopHeartbeat(), this.attemptReconnect();
  }
  /**
   * 尝试重连
   */
  attemptReconnect() {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      const i = new ae(
        "network",
        "Max reconnection attempts reached",
        !1
      );
      this.setState(
        "error"
        /* ERROR */
      ), this.emit({
        type: "reconnectFailed",
        error: i
      });
      return;
    }
    this.reconnectAttempts++, this.emit({
      type: "reconnecting",
      attempt: this.reconnectAttempts,
      maxAttempts: this.config.maxReconnectAttempts
    });
    const t = this.config.reconnectDelay, n = Math.min(
      t * Math.pow(2, this.reconnectAttempts - 1),
      3e4
      // 最大 30 秒
    ), r = Math.random() * 1e3, o = n + r;
    console.log(
      `[ConnectionManager] Reconnect attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts} in ${Math.round(o)}ms`
    ), this.reconnectTimer = setTimeout(() => {
      this.setState(
        "connecting"
        /* CONNECTING */
      ), this.startHeartbeat();
    }, o);
  }
  /**
   * 处理致命错误
   */
  handleFatalError(t, n) {
    const r = new ae(t, n, !1);
    this.setState(
      "error"
      /* ERROR */
    ), this.stopHeartbeat(), this.stopReconnect(), this.emit({
      type: "error",
      error: r
    });
  }
  /**
   * 处理可恢复错误
   */
  handleRecoverableError(t, n) {
    const r = new ae(t, n, !0);
    this.emit({
      type: "error",
      error: r
    });
  }
  /**
   * 重置重连计数
   */
  resetReconnectAttempts() {
    this.reconnectAttempts = 0;
  }
  /**
   * 手动触发重连
   */
  reconnect() {
    this.stopReconnect(), this.reconnectAttempts = 0, this.setState(
      "connecting"
      /* CONNECTING */
    ), this.startHeartbeat();
  }
  /**
   * 检查连接是否健康
   */
  isHealthy() {
    return this.state === "connected" && this.missedHeartbeats < Math.floor(this.config.maxMissedHeartbeats / 2);
  }
  /**
   * 获取连接统计信息
   */
  getStats() {
    return {
      state: this.state,
      missedHeartbeats: this.missedHeartbeats,
      reconnectAttempts: this.reconnectAttempts,
      isHealthy: this.isHealthy()
    };
  }
  /**
   * 启动心跳
   */
  startHeartbeat() {
    this.stopHeartbeat(), this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat();
    }, this.config.heartbeatInterval);
  }
  /**
   * 停止心跳
   */
  stopHeartbeat() {
    this.heartbeatTimer && (clearInterval(this.heartbeatTimer), this.heartbeatTimer = null), this.missedHeartbeats = 0;
  }
  /**
   * 停止重连
   */
  stopReconnect() {
    this.reconnectTimer && (clearTimeout(this.reconnectTimer), this.reconnectTimer = null), this.reconnectAttempts = 0;
  }
  /**
   * 设置连接状态
   */
  setState(t) {
    this.state !== t && (this.state = t, this.emit({ type: "stateChange", state: t }));
  }
  /**
   * 触发事件
   */
  emit(t) {
    this.listeners.forEach((n) => {
      try {
        n(t);
      } catch (r) {
        console.error("[ConnectionManager] Listener error:", r);
      }
    });
  }
  /**
   * 获取当前连接状态
   */
  getState() {
    return this.state;
  }
  /**
   * 是否已连接
   */
  isConnected() {
    return this.state === "connected";
  }
}
var $i = /* @__PURE__ */ ((e) => (e.IFRAME_NOT_READY = "IFRAME_NOT_READY", e.DISCONNECTED = "DISCONNECTED", e.MESSAGE_TIMEOUT = "MESSAGE_TIMEOUT", e.INVALID_RESPONSE = "INVALID_RESPONSE", e.SEND_FAILED = "SEND_FAILED", e))($i || {});
class T extends Error {
  constructor(t, n, r) {
    super(n), this.type = t, this.originalError = r, this.name = "SDKError";
  }
}
class Si {
  constructor(t) {
    this.messageId = 0, this.messageHistory = [], this.config = t, this.iframeManager = new $t(t), this.iframe = this.iframeManager.createIframe(), this.bridge = new wi({
      targetOrigin: t.targetOrigin,
      getContentWindow: () => this.iframeManager.getContentWindow(),
      onMessage: this.handleBridgeMessage.bind(this),
      onError: t.onError
    }), this.connection = new ki(
      () => this.iframeManager.getContentWindow(),
      t.targetOrigin
    ), this.connection.on((n) => {
      switch (n.type) {
        case "stateChange":
          this.config.onStateChange?.(n.state), (n.state === Q.DISCONNECTED || n.state === Q.ERROR) && this.rejectPendingMessages(new T(
            "DISCONNECTED",
            "Connection lost while waiting for response"
          ));
          break;
        case "error":
          this.config.onError?.(new T(
            "DISCONNECTED",
            n.error.message,
            n.error
          ));
          break;
        case "reconnecting":
          console.log(`[AIBridgeSDK] Reconnecting... (${n.attempt}/${n.maxAttempts})`);
          break;
        case "reconnectFailed":
          this.config.onError?.(new T(
            "DISCONNECTED",
            "Reconnection failed",
            n.error
          ));
          break;
      }
    }), this.init();
  }
  /**
   * 初始化 SDK
   */
  async init() {
    try {
      await this.iframeManager.waitForLoad(), this.bridge.start(), this.connection.start(), await this.sendInitMessage();
    } catch (t) {
      this.config.onError?.(t);
    }
  }
  /**
   * 处理来自桥接器的消息
   */
  handleBridgeMessage(t) {
    switch (t.type) {
      case "ready":
        break;
      case "messageResponse":
        this.config.onMessage?.(t.payload);
        break;
      case "error":
        this.config.onError?.(new Error(t.payload.message));
        break;
      case "heartbeatAck":
        this.connection.handleHeartbeatAck();
        break;
    }
  }
  /**
   * 发送初始化消息
   */
  async sendInitMessage() {
    const t = {
      type: "init",
      payload: {
        sessionId: this.config.context?.sessionId,
        theme: this.config.context?.theme ?? "light",
        locale: this.config.context?.locale ?? "zh-CN"
      }
    };
    await this.bridge.sendAndWait(t, 5e3);
  }
  /**
   * 发送消息到 Claude
   */
  async sendMessage(t, n) {
    const r = n?.timeout ?? 3e4, o = n?.retry ?? 1;
    if (!this.connection.isConnected())
      throw new T(
        "DISCONNECTED",
        "SDK not connected. Wait for the connection to be established."
      );
    if (!t || t.trim().length === 0)
      throw new T(
        "INVALID_RESPONSE",
        "Message text cannot be empty"
      );
    if (t.length > 1e4)
      throw new T(
        "INVALID_RESPONSE",
        "Message text too long (max 10000 characters)"
      );
    let i = null;
    for (let s = 0; s <= o; s++)
      try {
        const c = `msg_${Date.now()}_${this.messageId++}`, a = {
          type: "sendMessage",
          payload: {
            text: t,
            sessionId: this.config.context?.sessionId,
            messageId: c
          }
        }, l = await this.bridge.sendAndWait(a, r);
        if (l.type === "messageResponse") {
          const f = l.payload;
          return this.messageHistory.push(f), this.config.onMessage?.(f), f;
        } else
          throw new T(
            "INVALID_RESPONSE",
            `Unexpected response type: ${l.type}`
          );
      } catch (c) {
        if (i = c, s === o || c instanceof T && c.type === "INVALID_RESPONSE")
          break;
        await new Promise((a) => setTimeout(a, 1e3 * (s + 1)));
      }
    throw new T(
      "SEND_FAILED",
      `Failed to send message after ${o + 1} attempts`,
      i
    );
  }
  /**
   * 发送文本消息(简化版)
   *
   * @param text - 要发送的文本内容
   * @returns Promise<MessageResponse> Claude 的响应
   *
   * @example
   * const response = await sdk.chat('Hello, Claude!');
   * console.log(response.content);
   */
  async chat(t) {
    return this.sendMessage(t);
  }
  /**
   * 批量发送消息
   *
   * @param messages - 消息数组
   * @returns Promise<MessageResponse[]> 所有响应
   *
   * @example
   * const responses = await sdk.batch([
   *   'First message',
   *   'Second message',
   * ]);
   */
  async batch(t) {
    const n = [];
    for (const r of t) {
      const o = await this.sendMessage(r);
      n.push(o);
    }
    return n;
  }
  /**
   * 流式发送消息(带回调)
   *
   * @param text - 要发送的文本
   * @param callbacks - 回调函数
   * @returns Promise<MessageResponse> 最终响应
   *
   * @example
   * await sdk.stream('Long message...', {
   *   onProgress: (delta) => console.log('Received:', delta),
   *   onComplete: (response) => console.log('Done:', response),
   * });
   */
  async stream(t, n) {
    try {
      const r = await this.sendMessage(t);
      return n?.onComplete?.(r), r;
    } catch (r) {
      throw n?.onError?.(r), r;
    }
  }
  /**
   * 获取消息历史
   */
  getMessageHistory() {
    return [...this.messageHistory];
  }
  /**
   * 清空消息历史
   */
  clearHistory() {
    this.messageHistory = [];
  }
  /**
   * 拒绝所有待处理的消息
   */
  rejectPendingMessages(t) {
    this.config.onError?.(t);
  }
  /**
   * 检查 SDK 是否可用
   */
  isAvailable() {
    return this.connection.isConnected() && this.bridge.isActive();
  }
  /**
   * 等待 SDK 连接就绪
   */
  async ready(t = 3e4) {
    return new Promise((n, r) => {
      if (this.connection.isConnected()) {
        n();
        return;
      }
      const o = setTimeout(() => {
        s(), r(new T(
          "MESSAGE_TIMEOUT",
          "SDK ready timeout"
        ));
      }, t), i = this.connection.on((c) => {
        c.type === "stateChange" && c.state === Q.CONNECTED ? (s(), n()) : c.type === "reconnectFailed" && (s(), r(new T(
          "DISCONNECTED",
          "Failed to connect"
        )));
      }), s = () => {
        clearTimeout(o), i();
      };
    });
  }
  /**
   * 获取诊断信息
   */
  getDiagnostics() {
    return {
      state: this.connection.getState(),
      stats: this.connection.getStats(),
      pendingMessages: this.bridge.getPendingCount(),
      messageHistoryLength: this.messageHistory.length,
      iframeAttached: !!this.iframe.parentNode
    };
  }
  /**
   * 销毁 SDK
   */
  destroy() {
    this.bridge.stop(), this.connection.stop(), this.iframeManager.destroy();
  }
  /**
   * 获取当前连接状态
   */
  getState() {
    return this.connection.getState();
  }
}
export {
  Si as AIBridgeSDK,
  ae as ConnectionError,
  zi as ConnectionErrorType,
  ki as ConnectionManager,
  Q as ConnectionState,
  $t as IframeManager,
  bi as IframeResponseSchema,
  wi as MessageBridge,
  vi as MessageResponseSchema,
  T as SDKError,
  $i as SDKErrorType,
  yi as SdkMessageSchema,
  _i as SendMessagePayloadSchema
};
