var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// node_modules/papaparse/papaparse.min.js
var require_papaparse_min = __commonJS({
  "node_modules/papaparse/papaparse.min.js"(exports2, module2) {
    ((e, t) => {
      "function" == typeof define && define.amd ? define([], t) : "object" == typeof module2 && "undefined" != typeof exports2 ? module2.exports = t() : e.Papa = t();
    })(exports2, function r() {
      var n = "undefined" != typeof self ? self : "undefined" != typeof window ? window : void 0 !== n ? n : {};
      var d, s = !n.document && !!n.postMessage, a = n.IS_PAPA_WORKER || false, o = {}, h = 0, v = {};
      function u(e) {
        this._handle = null, this._finished = false, this._completed = false, this._halted = false, this._input = null, this._baseIndex = 0, this._partialLine = "", this._rowCount = 0, this._start = 0, this._nextChunk = null, this.isFirstChunk = true, this._completeResults = { data: [], errors: [], meta: {} }, function(e2) {
          var t = b(e2);
          t.chunkSize = parseInt(t.chunkSize), e2.step || e2.chunk || (t.chunkSize = null);
          this._handle = new i(t), (this._handle.streamer = this)._config = t;
        }.call(this, e), this.parseChunk = function(t, e2) {
          var i2 = parseInt(this._config.skipFirstNLines) || 0;
          if (this.isFirstChunk && 0 < i2) {
            let e3 = this._config.newline;
            e3 || (r2 = this._config.quoteChar || '"', e3 = this._handle.guessLineEndings(t, r2)), t = [...t.split(e3).slice(i2)].join(e3);
          }
          this.isFirstChunk && U(this._config.beforeFirstChunk) && void 0 !== (r2 = this._config.beforeFirstChunk(t)) && (t = r2), this.isFirstChunk = false, this._halted = false;
          var i2 = this._partialLine + t, r2 = (this._partialLine = "", this._handle.parse(i2, this._baseIndex, !this._finished));
          if (!this._handle.paused() && !this._handle.aborted()) {
            t = r2.meta.cursor, i2 = (this._finished || (this._partialLine = i2.substring(t - this._baseIndex), this._baseIndex = t), r2 && r2.data && (this._rowCount += r2.data.length), this._finished || this._config.preview && this._rowCount >= this._config.preview);
            if (a) n.postMessage({ results: r2, workerId: v.WORKER_ID, finished: i2 });
            else if (U(this._config.chunk) && !e2) {
              if (this._config.chunk(r2, this._handle), this._handle.paused() || this._handle.aborted()) return void (this._halted = true);
              this._completeResults = r2 = void 0;
            }
            return this._config.step || this._config.chunk || (this._completeResults.data = this._completeResults.data.concat(r2.data), this._completeResults.errors = this._completeResults.errors.concat(r2.errors), this._completeResults.meta = r2.meta), this._completed || !i2 || !U(this._config.complete) || r2 && r2.meta.aborted || (this._config.complete(this._completeResults, this._input), this._completed = true), i2 || r2 && r2.meta.paused || this._nextChunk(), r2;
          }
          this._halted = true;
        }, this._sendError = function(e2) {
          U(this._config.error) ? this._config.error(e2) : a && this._config.error && n.postMessage({ workerId: v.WORKER_ID, error: e2, finished: false });
        };
      }
      function f(e) {
        var r2;
        (e = e || {}).chunkSize || (e.chunkSize = v.RemoteChunkSize), u.call(this, e), this._nextChunk = s ? function() {
          this._readChunk(), this._chunkLoaded();
        } : function() {
          this._readChunk();
        }, this.stream = function(e2) {
          this._input = e2, this._nextChunk();
        }, this._readChunk = function() {
          if (this._finished) this._chunkLoaded();
          else {
            if (r2 = new XMLHttpRequest(), this._config.withCredentials && (r2.withCredentials = this._config.withCredentials), s || (r2.onload = y(this._chunkLoaded, this), r2.onerror = y(this._chunkError, this)), r2.open(this._config.downloadRequestBody ? "POST" : "GET", this._input, !s), this._config.downloadRequestHeaders) {
              var e2, t = this._config.downloadRequestHeaders;
              for (e2 in t) r2.setRequestHeader(e2, t[e2]);
            }
            var i2;
            this._config.chunkSize && (i2 = this._start + this._config.chunkSize - 1, r2.setRequestHeader("Range", "bytes=" + this._start + "-" + i2));
            try {
              r2.send(this._config.downloadRequestBody);
            } catch (e3) {
              this._chunkError(e3.message);
            }
            s && 0 === r2.status && this._chunkError();
          }
        }, this._chunkLoaded = function() {
          4 === r2.readyState && (r2.status < 200 || 400 <= r2.status ? this._chunkError() : (this._start += this._config.chunkSize || r2.responseText.length, this._finished = !this._config.chunkSize || this._start >= ((e2) => null !== (e2 = e2.getResponseHeader("Content-Range")) ? parseInt(e2.substring(e2.lastIndexOf("/") + 1)) : -1)(r2), this.parseChunk(r2.responseText)));
        }, this._chunkError = function(e2) {
          e2 = r2.statusText || e2;
          this._sendError(new Error(e2));
        };
      }
      function l(e) {
        (e = e || {}).chunkSize || (e.chunkSize = v.LocalChunkSize), u.call(this, e);
        var i2, r2, n2 = "undefined" != typeof FileReader;
        this.stream = function(e2) {
          this._input = e2, r2 = e2.slice || e2.webkitSlice || e2.mozSlice, n2 ? ((i2 = new FileReader()).onload = y(this._chunkLoaded, this), i2.onerror = y(this._chunkError, this)) : i2 = new FileReaderSync(), this._nextChunk();
        }, this._nextChunk = function() {
          this._finished || this._config.preview && !(this._rowCount < this._config.preview) || this._readChunk();
        }, this._readChunk = function() {
          var e2 = this._input, t = (this._config.chunkSize && (t = Math.min(this._start + this._config.chunkSize, this._input.size), e2 = r2.call(e2, this._start, t)), i2.readAsText(e2, this._config.encoding));
          n2 || this._chunkLoaded({ target: { result: t } });
        }, this._chunkLoaded = function(e2) {
          this._start += this._config.chunkSize, this._finished = !this._config.chunkSize || this._start >= this._input.size, this.parseChunk(e2.target.result);
        }, this._chunkError = function() {
          this._sendError(i2.error);
        };
      }
      function c(e) {
        var i2;
        u.call(this, e = e || {}), this.stream = function(e2) {
          return i2 = e2, this._nextChunk();
        }, this._nextChunk = function() {
          var e2, t;
          if (!this._finished) return e2 = this._config.chunkSize, i2 = e2 ? (t = i2.substring(0, e2), i2.substring(e2)) : (t = i2, ""), this._finished = !i2, this.parseChunk(t);
        };
      }
      function p(e) {
        u.call(this, e = e || {});
        var t = [], i2 = true, r2 = false;
        this.pause = function() {
          u.prototype.pause.apply(this, arguments), this._input.pause();
        }, this.resume = function() {
          u.prototype.resume.apply(this, arguments), this._input.resume();
        }, this.stream = function(e2) {
          this._input = e2, this._input.on("data", this._streamData), this._input.on("end", this._streamEnd), this._input.on("error", this._streamError);
        }, this._checkIsFinished = function() {
          r2 && 1 === t.length && (this._finished = true);
        }, this._nextChunk = function() {
          this._checkIsFinished(), t.length ? this.parseChunk(t.shift()) : i2 = true;
        }, this._streamData = y(function(e2) {
          try {
            t.push("string" == typeof e2 ? e2 : e2.toString(this._config.encoding)), i2 && (i2 = false, this._checkIsFinished(), this.parseChunk(t.shift()));
          } catch (e3) {
            this._streamError(e3);
          }
        }, this), this._streamError = y(function(e2) {
          this._streamCleanUp(), this._sendError(e2);
        }, this), this._streamEnd = y(function() {
          this._streamCleanUp(), r2 = true, this._streamData("");
        }, this), this._streamCleanUp = y(function() {
          this._input.removeListener("data", this._streamData), this._input.removeListener("end", this._streamEnd), this._input.removeListener("error", this._streamError);
        }, this);
      }
      function i(m2) {
        var n2, s2, a2, t, o2 = Math.pow(2, 53), h2 = -o2, u2 = /^\s*-?(\d+\.?|\.\d+|\d+\.\d+)([eE][-+]?\d+)?\s*$/, d2 = /^((\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z)))$/, i2 = this, r2 = 0, f2 = 0, l2 = false, e = false, c2 = [], p2 = { data: [], errors: [], meta: {} };
        function y2(e2) {
          return "greedy" === m2.skipEmptyLines ? "" === e2.join("").trim() : 1 === e2.length && 0 === e2[0].length;
        }
        function g2() {
          if (p2 && a2 && (k("Delimiter", "UndetectableDelimiter", "Unable to auto-detect delimiting character; defaulted to '" + v.DefaultDelimiter + "'"), a2 = false), m2.skipEmptyLines && (p2.data = p2.data.filter(function(e3) {
            return !y2(e3);
          })), _2()) {
            let t3 = function(e3, t4) {
              U(m2.transformHeader) && (e3 = m2.transformHeader(e3, t4)), c2.push(e3);
            };
            var t2 = t3;
            if (p2) if (Array.isArray(p2.data[0])) {
              for (var e2 = 0; _2() && e2 < p2.data.length; e2++) p2.data[e2].forEach(t3);
              p2.data.splice(0, 1);
            } else p2.data.forEach(t3);
          }
          function i3(e3, t3) {
            for (var i4 = m2.header ? {} : [], r4 = 0; r4 < e3.length; r4++) {
              var n3 = r4, s3 = e3[r4], s3 = ((e4, t4) => ((e5) => (m2.dynamicTypingFunction && void 0 === m2.dynamicTyping[e5] && (m2.dynamicTyping[e5] = m2.dynamicTypingFunction(e5)), true === (m2.dynamicTyping[e5] || m2.dynamicTyping)))(e4) ? "true" === t4 || "TRUE" === t4 || "false" !== t4 && "FALSE" !== t4 && (((e5) => {
                if (u2.test(e5)) {
                  e5 = parseFloat(e5);
                  if (h2 < e5 && e5 < o2) return 1;
                }
              })(t4) ? parseFloat(t4) : d2.test(t4) ? new Date(t4) : "" === t4 ? null : t4) : t4)(n3 = m2.header ? r4 >= c2.length ? "__parsed_extra" : c2[r4] : n3, s3 = m2.transform ? m2.transform(s3, n3) : s3);
              "__parsed_extra" === n3 ? (i4[n3] = i4[n3] || [], i4[n3].push(s3)) : i4[n3] = s3;
            }
            return m2.header && (r4 > c2.length ? k("FieldMismatch", "TooManyFields", "Too many fields: expected " + c2.length + " fields but parsed " + r4, f2 + t3) : r4 < c2.length && k("FieldMismatch", "TooFewFields", "Too few fields: expected " + c2.length + " fields but parsed " + r4, f2 + t3)), i4;
          }
          var r3;
          p2 && (m2.header || m2.dynamicTyping || m2.transform) && (r3 = 1, !p2.data.length || Array.isArray(p2.data[0]) ? (p2.data = p2.data.map(i3), r3 = p2.data.length) : p2.data = i3(p2.data, 0), m2.header && p2.meta && (p2.meta.fields = c2), f2 += r3);
        }
        function _2() {
          return m2.header && 0 === c2.length;
        }
        function k(e2, t2, i3, r3) {
          e2 = { type: e2, code: t2, message: i3 };
          void 0 !== r3 && (e2.row = r3), p2.errors.push(e2);
        }
        U(m2.step) && (t = m2.step, m2.step = function(e2) {
          p2 = e2, _2() ? g2() : (g2(), 0 !== p2.data.length && (r2 += e2.data.length, m2.preview && r2 > m2.preview ? s2.abort() : (p2.data = p2.data[0], t(p2, i2))));
        }), this.parse = function(e2, t2, i3) {
          var r3 = m2.quoteChar || '"', r3 = (m2.newline || (m2.newline = this.guessLineEndings(e2, r3)), a2 = false, m2.delimiter ? U(m2.delimiter) && (m2.delimiter = m2.delimiter(e2), p2.meta.delimiter = m2.delimiter) : ((r3 = ((e3, t3, i4, r4, n3) => {
            var s3, a3, o3, h3;
            n3 = n3 || [",", "	", "|", ";", v.RECORD_SEP, v.UNIT_SEP];
            for (var u3 = 0; u3 < n3.length; u3++) {
              for (var d3, f3 = n3[u3], l3 = 0, c3 = 0, p3 = 0, g3 = (o3 = void 0, new E({ comments: r4, delimiter: f3, newline: t3, preview: 10 }).parse(e3)), _3 = 0; _3 < g3.data.length; _3++) i4 && y2(g3.data[_3]) ? p3++ : (d3 = g3.data[_3].length, c3 += d3, void 0 === o3 ? o3 = d3 : 0 < d3 && (l3 += Math.abs(d3 - o3), o3 = d3));
              0 < g3.data.length && (c3 /= g3.data.length - p3), (void 0 === a3 || l3 <= a3) && (void 0 === h3 || h3 < c3) && 1.99 < c3 && (a3 = l3, s3 = f3, h3 = c3);
            }
            return { successful: !!(m2.delimiter = s3), bestDelimiter: s3 };
          })(e2, m2.newline, m2.skipEmptyLines, m2.comments, m2.delimitersToGuess)).successful ? m2.delimiter = r3.bestDelimiter : (a2 = true, m2.delimiter = v.DefaultDelimiter), p2.meta.delimiter = m2.delimiter), b(m2));
          return m2.preview && m2.header && r3.preview++, n2 = e2, s2 = new E(r3), p2 = s2.parse(n2, t2, i3), g2(), l2 ? { meta: { paused: true } } : p2 || { meta: { paused: false } };
        }, this.paused = function() {
          return l2;
        }, this.pause = function() {
          l2 = true, s2.abort(), n2 = U(m2.chunk) ? "" : n2.substring(s2.getCharIndex());
        }, this.resume = function() {
          i2.streamer._halted ? (l2 = false, i2.streamer.parseChunk(n2, true)) : setTimeout(i2.resume, 3);
        }, this.aborted = function() {
          return e;
        }, this.abort = function() {
          e = true, s2.abort(), p2.meta.aborted = true, U(m2.complete) && m2.complete(p2), n2 = "";
        }, this.guessLineEndings = function(e2, t2) {
          e2 = e2.substring(0, 1048576);
          var t2 = new RegExp(P(t2) + "([^]*?)" + P(t2), "gm"), i3 = (e2 = e2.replace(t2, "")).split("\r"), t2 = e2.split("\n"), e2 = 1 < t2.length && t2[0].length < i3[0].length;
          if (1 === i3.length || e2) return "\n";
          for (var r3 = 0, n3 = 0; n3 < i3.length; n3++) "\n" === i3[n3][0] && r3++;
          return r3 >= i3.length / 2 ? "\r\n" : "\r";
        };
      }
      function P(e) {
        return e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      }
      function E(C) {
        var S = (C = C || {}).delimiter, O = C.newline, x = C.comments, I = C.step, A = C.preview, T = C.fastMode, D = null, L = false, F = null == C.quoteChar ? '"' : C.quoteChar, j = F;
        if (void 0 !== C.escapeChar && (j = C.escapeChar), ("string" != typeof S || -1 < v.BAD_DELIMITERS.indexOf(S)) && (S = ","), x === S) throw new Error("Comment character same as delimiter");
        true === x ? x = "#" : ("string" != typeof x || -1 < v.BAD_DELIMITERS.indexOf(x)) && (x = false), "\n" !== O && "\r" !== O && "\r\n" !== O && (O = "\n");
        var z = 0, M = false;
        this.parse = function(i2, t, r2) {
          if ("string" != typeof i2) throw new Error("Input must be a string");
          var n2 = i2.length, e = S.length, s2 = O.length, a2 = x.length, o2 = U(I), h2 = [], u2 = [], d2 = [], f2 = z = 0;
          if (!i2) return w();
          if (T || false !== T && -1 === i2.indexOf(F)) {
            for (var l2 = i2.split(O), c2 = 0; c2 < l2.length; c2++) {
              if (d2 = l2[c2], z += d2.length, c2 !== l2.length - 1) z += O.length;
              else if (r2) return w();
              if (!x || d2.substring(0, a2) !== x) {
                if (o2) {
                  if (h2 = [], k(d2.split(S)), R(), M) return w();
                } else k(d2.split(S));
                if (A && A <= c2) return h2 = h2.slice(0, A), w(true);
              }
            }
            return w();
          }
          for (var p2 = i2.indexOf(S, z), g2 = i2.indexOf(O, z), _2 = new RegExp(P(j) + P(F), "g"), m2 = i2.indexOf(F, z); ; ) if (i2[z] === F) for (m2 = z, z++; ; ) {
            if (-1 === (m2 = i2.indexOf(F, m2 + 1))) return r2 || u2.push({ type: "Quotes", code: "MissingQuotes", message: "Quoted field unterminated", row: h2.length, index: z }), E2();
            if (m2 === n2 - 1) return E2(i2.substring(z, m2).replace(_2, F));
            if (F === j && i2[m2 + 1] === j) m2++;
            else if (F === j || 0 === m2 || i2[m2 - 1] !== j) {
              -1 !== p2 && p2 < m2 + 1 && (p2 = i2.indexOf(S, m2 + 1));
              var y2 = v2(-1 === (g2 = -1 !== g2 && g2 < m2 + 1 ? i2.indexOf(O, m2 + 1) : g2) ? p2 : Math.min(p2, g2));
              if (i2.substr(m2 + 1 + y2, e) === S) {
                d2.push(i2.substring(z, m2).replace(_2, F)), i2[z = m2 + 1 + y2 + e] !== F && (m2 = i2.indexOf(F, z)), p2 = i2.indexOf(S, z), g2 = i2.indexOf(O, z);
                break;
              }
              y2 = v2(g2);
              if (i2.substring(m2 + 1 + y2, m2 + 1 + y2 + s2) === O) {
                if (d2.push(i2.substring(z, m2).replace(_2, F)), b2(m2 + 1 + y2 + s2), p2 = i2.indexOf(S, z), m2 = i2.indexOf(F, z), o2 && (R(), M)) return w();
                if (A && h2.length >= A) return w(true);
                break;
              }
              u2.push({ type: "Quotes", code: "InvalidQuotes", message: "Trailing quote on quoted field is malformed", row: h2.length, index: z }), m2++;
            }
          }
          else if (x && 0 === d2.length && i2.substring(z, z + a2) === x) {
            if (-1 === g2) return w();
            z = g2 + s2, g2 = i2.indexOf(O, z), p2 = i2.indexOf(S, z);
          } else if (-1 !== p2 && (p2 < g2 || -1 === g2)) d2.push(i2.substring(z, p2)), z = p2 + e, p2 = i2.indexOf(S, z);
          else {
            if (-1 === g2) break;
            if (d2.push(i2.substring(z, g2)), b2(g2 + s2), o2 && (R(), M)) return w();
            if (A && h2.length >= A) return w(true);
          }
          return E2();
          function k(e2) {
            h2.push(e2), f2 = z;
          }
          function v2(e2) {
            var t2 = 0;
            return t2 = -1 !== e2 && (e2 = i2.substring(m2 + 1, e2)) && "" === e2.trim() ? e2.length : t2;
          }
          function E2(e2) {
            return r2 || (void 0 === e2 && (e2 = i2.substring(z)), d2.push(e2), z = n2, k(d2), o2 && R()), w();
          }
          function b2(e2) {
            z = e2, k(d2), d2 = [], g2 = i2.indexOf(O, z);
          }
          function w(e2) {
            if (C.header && !t && h2.length && !L) {
              var s3 = h2[0], a3 = /* @__PURE__ */ Object.create(null), o3 = new Set(s3);
              let n3 = false;
              for (let r3 = 0; r3 < s3.length; r3++) {
                let i3 = s3[r3];
                if (a3[i3 = U(C.transformHeader) ? C.transformHeader(i3, r3) : i3]) {
                  let e3, t2 = a3[i3];
                  for (; e3 = i3 + "_" + t2, t2++, o3.has(e3); ) ;
                  o3.add(e3), s3[r3] = e3, a3[i3]++, n3 = true, (D = null === D ? {} : D)[e3] = i3;
                } else a3[i3] = 1, s3[r3] = i3;
                o3.add(i3);
              }
              n3 && console.warn("Duplicate headers found and renamed."), L = true;
            }
            return { data: h2, errors: u2, meta: { delimiter: S, linebreak: O, aborted: M, truncated: !!e2, cursor: f2 + (t || 0), renamedHeaders: D } };
          }
          function R() {
            I(w()), h2 = [], u2 = [];
          }
        }, this.abort = function() {
          M = true;
        }, this.getCharIndex = function() {
          return z;
        };
      }
      function g(e) {
        var t = e.data, i2 = o[t.workerId], r2 = false;
        if (t.error) i2.userError(t.error, t.file);
        else if (t.results && t.results.data) {
          var n2 = { abort: function() {
            r2 = true, _(t.workerId, { data: [], errors: [], meta: { aborted: true } });
          }, pause: m, resume: m };
          if (U(i2.userStep)) {
            for (var s2 = 0; s2 < t.results.data.length && (i2.userStep({ data: t.results.data[s2], errors: t.results.errors, meta: t.results.meta }, n2), !r2); s2++) ;
            delete t.results;
          } else U(i2.userChunk) && (i2.userChunk(t.results, n2, t.file), delete t.results);
        }
        t.finished && !r2 && _(t.workerId, t.results);
      }
      function _(e, t) {
        var i2 = o[e];
        U(i2.userComplete) && i2.userComplete(t), i2.terminate(), delete o[e];
      }
      function m() {
        throw new Error("Not implemented.");
      }
      function b(e) {
        if ("object" != typeof e || null === e) return e;
        var t, i2 = Array.isArray(e) ? [] : {};
        for (t in e) i2[t] = b(e[t]);
        return i2;
      }
      function y(e, t) {
        return function() {
          e.apply(t, arguments);
        };
      }
      function U(e) {
        return "function" == typeof e;
      }
      return v.parse = function(e, t) {
        var i2 = (t = t || {}).dynamicTyping || false;
        U(i2) && (t.dynamicTypingFunction = i2, i2 = {});
        if (t.dynamicTyping = i2, t.transform = !!U(t.transform) && t.transform, !t.worker || !v.WORKERS_SUPPORTED) return i2 = null, v.NODE_STREAM_INPUT, "string" == typeof e ? (e = ((e2) => 65279 !== e2.charCodeAt(0) ? e2 : e2.slice(1))(e), i2 = new (t.download ? f : c)(t)) : true === e.readable && U(e.read) && U(e.on) ? i2 = new p(t) : (n.File && e instanceof File || e instanceof Object) && (i2 = new l(t)), i2.stream(e);
        (i2 = (() => {
          var e2;
          return !!v.WORKERS_SUPPORTED && (e2 = (() => {
            var e3 = n.URL || n.webkitURL || null, t2 = r.toString();
            return v.BLOB_URL || (v.BLOB_URL = e3.createObjectURL(new Blob(["var global = (function() { if (typeof self !== 'undefined') { return self; } if (typeof window !== 'undefined') { return window; } if (typeof global !== 'undefined') { return global; } return {}; })(); global.IS_PAPA_WORKER=true; ", "(", t2, ")();"], { type: "text/javascript" })));
          })(), (e2 = new n.Worker(e2)).onmessage = g, e2.id = h++, o[e2.id] = e2);
        })()).userStep = t.step, i2.userChunk = t.chunk, i2.userComplete = t.complete, i2.userError = t.error, t.step = U(t.step), t.chunk = U(t.chunk), t.complete = U(t.complete), t.error = U(t.error), delete t.worker, i2.postMessage({ input: e, config: t, workerId: i2.id });
      }, v.unparse = function(e, t) {
        var n2 = false, _2 = true, m2 = ",", y2 = "\r\n", s2 = '"', a2 = s2 + s2, i2 = false, r2 = null, o2 = false, h2 = ((() => {
          if ("object" == typeof t) {
            if ("string" != typeof t.delimiter || v.BAD_DELIMITERS.filter(function(e2) {
              return -1 !== t.delimiter.indexOf(e2);
            }).length || (m2 = t.delimiter), "boolean" != typeof t.quotes && "function" != typeof t.quotes && !Array.isArray(t.quotes) || (n2 = t.quotes), "boolean" != typeof t.skipEmptyLines && "string" != typeof t.skipEmptyLines || (i2 = t.skipEmptyLines), "string" == typeof t.newline && (y2 = t.newline), "string" == typeof t.quoteChar && (s2 = t.quoteChar), "boolean" == typeof t.header && (_2 = t.header), Array.isArray(t.columns)) {
              if (0 === t.columns.length) throw new Error("Option columns is empty");
              r2 = t.columns;
            }
            void 0 !== t.escapeChar && (a2 = t.escapeChar + s2), t.escapeFormulae instanceof RegExp ? o2 = t.escapeFormulae : "boolean" == typeof t.escapeFormulae && t.escapeFormulae && (o2 = /^[=+\-@\t\r].*$/);
          }
        })(), new RegExp(P(s2), "g"));
        "string" == typeof e && (e = JSON.parse(e));
        if (Array.isArray(e)) {
          if (!e.length || Array.isArray(e[0])) return u2(null, e, i2);
          if ("object" == typeof e[0]) return u2(r2 || Object.keys(e[0]), e, i2);
        } else if ("object" == typeof e) return "string" == typeof e.data && (e.data = JSON.parse(e.data)), Array.isArray(e.data) && (e.fields || (e.fields = e.meta && e.meta.fields || r2), e.fields || (e.fields = Array.isArray(e.data[0]) ? e.fields : "object" == typeof e.data[0] ? Object.keys(e.data[0]) : []), Array.isArray(e.data[0]) || "object" == typeof e.data[0] || (e.data = [e.data])), u2(e.fields || [], e.data || [], i2);
        throw new Error("Unable to serialize unrecognized input");
        function u2(e2, t2, i3) {
          var r3 = "", n3 = ("string" == typeof e2 && (e2 = JSON.parse(e2)), "string" == typeof t2 && (t2 = JSON.parse(t2)), Array.isArray(e2) && 0 < e2.length), s3 = !Array.isArray(t2[0]);
          if (n3 && _2) {
            for (var a3 = 0; a3 < e2.length; a3++) 0 < a3 && (r3 += m2), r3 += k(e2[a3], a3);
            0 < t2.length && (r3 += y2);
          }
          for (var o3 = 0; o3 < t2.length; o3++) {
            var h3 = (n3 ? e2 : t2[o3]).length, u3 = false, d2 = n3 ? 0 === Object.keys(t2[o3]).length : 0 === t2[o3].length;
            if (i3 && !n3 && (u3 = "greedy" === i3 ? "" === t2[o3].join("").trim() : 1 === t2[o3].length && 0 === t2[o3][0].length), "greedy" === i3 && n3) {
              for (var f2 = [], l2 = 0; l2 < h3; l2++) {
                var c2 = s3 ? e2[l2] : l2;
                f2.push(t2[o3][c2]);
              }
              u3 = "" === f2.join("").trim();
            }
            if (!u3) {
              for (var p2 = 0; p2 < h3; p2++) {
                0 < p2 && !d2 && (r3 += m2);
                var g2 = n3 && s3 ? e2[p2] : p2;
                r3 += k(t2[o3][g2], p2);
              }
              o3 < t2.length - 1 && (!i3 || 0 < h3 && !d2) && (r3 += y2);
            }
          }
          return r3;
        }
        function k(e2, t2) {
          var i3, r3;
          return null == e2 ? "" : e2.constructor === Date ? JSON.stringify(e2).slice(1, 25) : (r3 = false, o2 && "string" == typeof e2 && o2.test(e2) && (e2 = "'" + e2, r3 = true), i3 = e2.toString().replace(h2, a2), (r3 = r3 || true === n2 || "function" == typeof n2 && n2(e2, t2) || Array.isArray(n2) && n2[t2] || ((e3, t3) => {
            for (var i4 = 0; i4 < t3.length; i4++) if (-1 < e3.indexOf(t3[i4])) return true;
            return false;
          })(i3, v.BAD_DELIMITERS) || -1 < i3.indexOf(m2) || " " === i3.charAt(0) || " " === i3.charAt(i3.length - 1)) ? s2 + i3 + s2 : i3);
        }
      }, v.RECORD_SEP = String.fromCharCode(30), v.UNIT_SEP = String.fromCharCode(31), v.BYTE_ORDER_MARK = "\uFEFF", v.BAD_DELIMITERS = ["\r", "\n", '"', v.BYTE_ORDER_MARK], v.WORKERS_SUPPORTED = !s && !!n.Worker, v.NODE_STREAM_INPUT = 1, v.LocalChunkSize = 10485760, v.RemoteChunkSize = 5242880, v.DefaultDelimiter = ",", v.Parser = E, v.ParserHandle = i, v.NetworkStreamer = f, v.FileStreamer = l, v.StringStreamer = c, v.ReadableStreamStreamer = p, n.jQuery && ((d = n.jQuery).fn.parse = function(o2) {
        var i2 = o2.config || {}, h2 = [];
        return this.each(function(e2) {
          if (!("INPUT" === d(this).prop("tagName").toUpperCase() && "file" === d(this).attr("type").toLowerCase() && n.FileReader) || !this.files || 0 === this.files.length) return true;
          for (var t = 0; t < this.files.length; t++) h2.push({ file: this.files[t], inputElem: this, instanceConfig: d.extend({}, i2) });
        }), e(), this;
        function e() {
          if (0 === h2.length) U(o2.complete) && o2.complete();
          else {
            var e2, t, i3, r2, n2 = h2[0];
            if (U(o2.before)) {
              var s2 = o2.before(n2.file, n2.inputElem);
              if ("object" == typeof s2) {
                if ("abort" === s2.action) return e2 = "AbortError", t = n2.file, i3 = n2.inputElem, r2 = s2.reason, void (U(o2.error) && o2.error({ name: e2 }, t, i3, r2));
                if ("skip" === s2.action) return void u2();
                "object" == typeof s2.config && (n2.instanceConfig = d.extend(n2.instanceConfig, s2.config));
              } else if ("skip" === s2) return void u2();
            }
            var a2 = n2.instanceConfig.complete;
            n2.instanceConfig.complete = function(e3) {
              U(a2) && a2(e3, n2.file, n2.inputElem), u2();
            }, v.parse(n2.file, n2.instanceConfig);
          }
        }
        function u2() {
          h2.splice(0, 1), e();
        }
      }), a && (n.onmessage = function(e) {
        e = e.data;
        void 0 === v.WORKER_ID && e && (v.WORKER_ID = e.workerId);
        "string" == typeof e.input ? n.postMessage({ workerId: v.WORKER_ID, results: v.parse(e.input, e.config), finished: true }) : (n.File && e.input instanceof File || e.input instanceof Object) && (e = v.parse(e.input, e.config)) && n.postMessage({ workerId: v.WORKER_ID, results: e, finished: true });
      }), (f.prototype = Object.create(u.prototype)).constructor = f, (l.prototype = Object.create(u.prototype)).constructor = l, (c.prototype = Object.create(c.prototype)).constructor = c, (p.prototype = Object.create(u.prototype)).constructor = p, v;
    });
  }
});

// src/constants.js
var require_constants = __commonJS({
  "src/constants.js"(exports2, module2) {
    var CONSTANTS2 = {
      // LEARNING: These are "reserved words" in Dataview - using them causes conflicts
      // This is why we validate column names against this list
      DATAVIEW_RESERVED_FIELDS: ["file", "tags", "aliases"],
      // LEARNING: Having a folder constant means if we want to change the default,
      // we change it in ONE place, not hunt through the entire codebase
      TEMPLATE_FOLDER: "CSV Templates",
      // LEARNING: Enum pattern - instead of comparing strings everywhere,
      // we use these constants. Typos become compile-time errors instead of runtime bugs
      OUTPUT_FORMATS: {
        JSON: "json",
        MARKDOWN: "markdown",
        DATAVIEW: "dataview"
      },
      // LEARNING: Configuration objects make it easy to add new presets
      // Notice how each preset is self-describing with id, name, and expected columns
      PRESETS: {
        HIERARCHICAL: {
          id: "hierarchical",
          name: "Hierarchical",
          columns: ["Subject", "Type", "Project", "Item"]
          // These are column names to look for
        },
        PROJECT: {
          id: "project",
          name: "Project-Based",
          columns: ["Project", "Type", "Item"]
        },
        SIMPLE: {
          id: "simple",
          name: "Simple Grouping",
          columns: []
          // Empty means "use first 2 columns of whatever CSV we load"
        }
      },
      // LEARNING: CSS class names as constants prevent typos and make refactoring easier
      // If you need to rename a class, you change it here, not in 15 different files
      CSS_CLASSES: {
        MODAL: "csv-json-modal",
        CONTAINER: "csv-json-container",
        STEP: "csv-json-step",
        COLUMN_TAG: "csv-json-column-tag",
        LEVEL: "csv-json-level",
        DRAGGING: "dragging",
        // State classes
        USED: "used",
        // for visual feedback
        EXCLUDED: "excluded",
        ACTIVE: "active"
      },
      // LEARNING: Configuration values that might need tweaking
      // By putting them here, non-programmers can adjust them without touching logic
      SUPPORTED_EXTENSIONS: ["csv"],
      MAX_FILE_SIZE: 50 * 1024 * 1024,
      // 50MB - notice the readable math
      // LEARNING: UI/UX constants that affect user experience
      MAX_PREVIEW_ROWS: 5,
      // How many rows to show in preview
      BATCH_SIZE: 1e3
      // Process large files in chunks of this size
    };
    module2.exports = CONSTANTS2;
  }
});

// src/utils.js
var require_utils = __commonJS({
  "src/utils.js"(exports2, module2) {
    var CONSTANTS2 = require_constants();
    var Utils = class _Utils {
      /**
       * LEARNING: Input validation pattern
       * Notice how EVERY method starts by checking if the input is valid
       * This prevents the dreaded "undefined is not a function" errors
       * 
       * @param {string} fieldName - The field name to sanitize
       * @returns {string} Sanitized field name
       */
      static sanitizeFieldName(fieldName) {
        if (!fieldName || typeof fieldName !== "string") {
          return "unknown_field";
        }
        return fieldName.toLowerCase().replace(/[^a-z0-9_-]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
      }
      /**
       * LEARNING: Similar function, different rules
       * Tags and field names have different requirements in Obsidian
       * Instead of one "sanitize everything" function, we have specific ones
       */
      static sanitizeTagName(tag) {
        if (!tag || typeof tag !== "string") {
          return "unknown";
        }
        return tag.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
      }
      /**
       * LEARNING: YAML escaping - why this is necessary
       * YAML is picky about quotes, newlines, and special characters
       * This function makes any string safe to put in YAML frontmatter
       */
      static escapeYAMLString(str) {
        if (str === null || str === void 0) {
          return "";
        }
        return String(str).replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n").replace(/\r/g, "\\r");
      }
      /**
       * LEARNING: Validation function pattern
       * Instead of returning true/false, return an object with details
       * This gives the caller much more useful information
       */
      static validateDataviewColumns(columns) {
        const warnings = [];
        const errors = [];
        columns.forEach((col) => {
          if (CONSTANTS2.DATAVIEW_RESERVED_FIELDS.includes(col.toLowerCase())) {
            warnings.push(`"${col}" is a reserved Dataview field name`);
          }
          if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(col)) {
            warnings.push(`"${col}" contains characters that may cause issues`);
          }
          if (!col || col.trim().length === 0) {
            errors.push("Found empty column name");
          }
        });
        return {
          warnings,
          errors,
          isValid: errors.length === 0
          // Computed property based on errors
        };
      }
      /**
       * LEARNING: Filename sanitization with length limits
       * File systems have limits on filename length and allowed characters
       */
      static generateSafeFilename(str, maxLength = 100) {
        if (!str || typeof str !== "string") {
          return "untitled";
        }
        const safe = str.replace(/[^\w\s-]/g, "").replace(/\s+/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "").substring(0, maxLength);
        return safe || "untitled";
      }
      /**
       * LEARNING: Deep cloning - why JSON.parse(JSON.stringify()) isn't enough
       * This handles dates, functions, and circular references properly
       */
      static deepClone(obj) {
        if (obj === null || typeof obj !== "object") {
          return obj;
        }
        if (obj instanceof Date) {
          return new Date(obj.getTime());
        }
        if (Array.isArray(obj)) {
          return obj.map((item) => _Utils.deepClone(item));
        }
        const cloned = {};
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            cloned[key] = _Utils.deepClone(obj[key]);
          }
        }
        return cloned;
      }
      /**
       * LEARNING: Debounce pattern - prevent function from being called too often
       * Useful for search boxes, resize handlers, etc.
       */
      static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
          const later = () => {
            clearTimeout(timeout);
            func(...args);
          };
          clearTimeout(timeout);
          timeout = setTimeout(later, wait);
        };
      }
      /**
       * LEARNING: Human-readable file sizes
       * Converts bytes to KB, MB, GB with proper units
       */
      static formatFileSize(bytes) {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
      }
      /**
       * LEARNING: Error message extraction - handle different error types
       * Errors can be strings, Error objects, or other types
       */
      static getErrorMessage(error) {
        if (typeof error === "string") {
          return error;
        }
        if (error && error.message) {
          return error.message;
        }
        return "An unknown error occurred";
      }
      /**
       * LEARNING: Universal "emptiness" checker
       * Different types have different meanings of "empty"
       */
      static isEmpty(value) {
        if (value === null || value === void 0) {
          return true;
        }
        if (typeof value === "string") {
          return value.trim().length === 0;
        }
        if (Array.isArray(value)) {
          return value.length === 0;
        }
        if (typeof value === "object") {
          return Object.keys(value).length === 0;
        }
        return false;
      }
    };
    module2.exports = Utils;
  }
});

// src/csv-processor.js
var require_csv_processor = __commonJS({
  "src/csv-processor.js"(exports2, module2) {
    var { parse } = require_papaparse_min();
    var Utils = require_utils();
    var CONSTANTS2 = require_constants();
    var CSVProcessor = class {
      constructor() {
        this.csvData = null;
        this.csvColumns = [];
        this.fileName = "";
        this.parseErrors = [];
        this.parseWarnings = [];
      }
      /**
       * LEARNING: Async/await pattern for file processing
       * CSV parsing might be slow for large files, so we make it async
       * This prevents blocking the UI thread
       */
      async parseCSV(content, fileName) {
        try {
          this.fileName = fileName;
          if (!content || typeof content !== "string") {
            throw new Error("Invalid CSV content provided");
          }
          if (content.trim().length === 0) {
            throw new Error("CSV file is empty");
          }
          const parseResult = parse(content, {
            header: true,
            // First row becomes column names
            dynamicTyping: true,
            // Convert "123" to number 123
            skipEmptyLines: true,
            // Ignore blank rows
            transformHeader: (header) => header.trim(),
            // Clean column names
            delimitersToGuess: [",", "	", "|", ";"]
            // Try different separators
          });
          this.csvData = parseResult.data;
          this.csvColumns = parseResult.meta.fields || [];
          this.parseErrors = parseResult.errors || [];
          this.parseWarnings = [];
          if (parseResult.errors.length > 0) {
            this.parseWarnings = parseResult.errors.filter((error) => error.type !== "Delimiter").map((error) => `Row ${error.row}: ${error.message}`);
          }
          const validation = Utils.validateDataviewColumns(this.csvColumns);
          this.parseWarnings.push(...validation.warnings);
          this._validateData();
          return {
            success: true,
            rowCount: this.csvData.length,
            columnCount: this.csvColumns.length,
            warnings: this.parseWarnings,
            errors: this.parseErrors
          };
        } catch (error) {
          this.csvData = null;
          this.csvColumns = [];
          return {
            success: false,
            error: Utils.getErrorMessage(error),
            warnings: [],
            errors: [error]
          };
        }
      }
      /**
       * LEARNING: Private method pattern (convention, not enforced)
       * Methods starting with _ are meant for internal use only
       */
      _validateData() {
        if (!this.csvData || this.csvData.length === 0) {
          throw new Error("No data rows found in CSV");
        }
        if (!this.csvColumns || this.csvColumns.length === 0) {
          throw new Error("No column headers found in CSV");
        }
        const duplicates = this._findDuplicateColumns();
        if (duplicates.length > 0) {
          this.parseWarnings.push(`Duplicate column names found: ${duplicates.join(", ")}`);
        }
        const inconsistencies = this._checkDataConsistency();
        if (inconsistencies.length > 0) {
          this.parseWarnings.push(...inconsistencies);
        }
      }
      /**
       * LEARNING: Set-based duplicate detection
       * Sets automatically handle uniqueness for us
       */
      _findDuplicateColumns() {
        const seen = /* @__PURE__ */ new Set();
        const duplicates = /* @__PURE__ */ new Set();
        this.csvColumns.forEach((col) => {
          if (seen.has(col)) {
            duplicates.add(col);
          } else {
            seen.add(col);
          }
        });
        return Array.from(duplicates);
      }
      /**
       * LEARNING: Data quality analysis
       * This method shows functional programming patterns
       */
      _checkDataConsistency() {
        const warnings = [];
        const emptyColumns = this.csvColumns.filter((col) => {
          return this.csvData.every((row) => Utils.isEmpty(row[col]));
        });
        if (emptyColumns.length > 0) {
          warnings.push(`Empty columns detected: ${emptyColumns.join(", ")}`);
        }
        const sparseColumns = this.csvColumns.filter((col) => {
          const emptyCount = this.csvData.filter((row) => Utils.isEmpty(row[col])).length;
          return emptyCount / this.csvData.length > 0.9;
        });
        if (sparseColumns.length > 0) {
          warnings.push(`Sparse columns (>90% empty): ${sparseColumns.join(", ")}`);
        }
        return warnings;
      }
      /**
       * LEARNING: Data preview for UI
       * Limit the amount of data returned to avoid UI slowdown
       */
      generatePreview(maxRows = CONSTANTS2.MAX_PREVIEW_ROWS) {
        if (!this.csvData || this.csvData.length === 0) {
          return { columns: [], preview: [], totalRows: 0 };
        }
        const previewRows = this.csvData.slice(0, maxRows);
        return {
          columns: this.csvColumns,
          preview: previewRows,
          totalRows: this.csvData.length,
          fileName: this.fileName
        };
      }
      /**
       * LEARNING: Main processing method - this is where the magic happens
       * Takes configuration and returns structured data
       */
      processData(config) {
        const { structure, excludedColumns, outputFormat } = config;
        if (!this.csvData || structure.length === 0) {
          throw new Error("No data or structure configuration provided");
        }
        const missingColumns = structure.filter((col) => !this.csvColumns.includes(col));
        if (missingColumns.length > 0) {
          throw new Error(`Structure references missing columns: ${missingColumns.join(", ")}`);
        }
        const dataColumns = this.csvColumns.filter(
          (col) => !structure.includes(col) && !excludedColumns.includes(col)
        );
        switch (outputFormat) {
          case CONSTANTS2.OUTPUT_FORMATS.JSON:
            return this._processToJSON(structure, dataColumns, excludedColumns);
          case CONSTANTS2.OUTPUT_FORMATS.MARKDOWN:
          case CONSTANTS2.OUTPUT_FORMATS.DATAVIEW:
            return this._processToMarkdownData(structure, dataColumns, excludedColumns, outputFormat);
          default:
            throw new Error(`Unsupported output format: ${outputFormat}`);
        }
      }
      /**
       * LEARNING: JSON structure building
       * This is the core algorithm that creates nested JSON from flat CSV data
       */
      _processToJSON(structure, dataColumns, excludedColumns) {
        const result = {
          metadata: {
            sourceFile: this.fileName,
            structure: structure.join(" \u2192 "),
            // Human-readable structure description
            dataColumns,
            excludedColumns,
            totalEntries: this.csvData.length,
            generated: (/* @__PURE__ */ new Date()).toISOString()
          },
          data: {}
        };
        this.csvData.forEach((row, index) => {
          let current = result.data;
          structure.forEach((col, level) => {
            const key = this._generateKey(row[col], col, index);
            if (level === structure.length - 1) {
              const dataObject = {};
              dataColumns.forEach((dataCol) => {
                dataObject[dataCol] = row[dataCol];
              });
              dataObject._metadata = {
                sourceRow: index + 1,
                // 1-based row numbers for humans
                structurePath: structure.map((structCol) => row[structCol]).join(" \u2192 ")
              };
              current[key] = dataObject;
            } else {
              current[key] = current[key] || {};
              current = current[key];
            }
          });
        });
        return result;
      }
      /**
       * LEARNING: Markdown data preparation
       * Instead of generating markdown here, we prepare data for the OutputGenerator
       * This separation keeps each class focused on its responsibility
       */
      _processToMarkdownData(structure, dataColumns, excludedColumns, outputFormat) {
        const markdownData = [];
        this.csvData.forEach((row, index) => {
          const filenameParts = structure.map((col) => {
            const value = row[col] || `Empty_${col}`;
            return Utils.generateSafeFilename(String(value));
          });
          const filename = filenameParts.join(" - ") + ".md";
          const rowData = {
            filename,
            sourceRow: index + 1,
            structureData: {},
            // Data used for structure/hierarchy
            contentData: {},
            // Data that goes in content
            allData: { ...row }
            // Complete row data for reference
          };
          structure.forEach((col) => {
            rowData.structureData[col] = row[col];
          });
          dataColumns.forEach((col) => {
            rowData.contentData[col] = row[col];
          });
          markdownData.push(rowData);
        });
        return {
          format: outputFormat,
          structure,
          dataColumns,
          excludedColumns,
          sourceFile: this.fileName,
          generated: (/* @__PURE__ */ new Date()).toISOString(),
          data: markdownData
        };
      }
      /**
       * LEARNING: Key generation for JSON structure
       * Handles empty/null values gracefully
       */
      _generateKey(value, columnName, rowIndex) {
        if (Utils.isEmpty(value)) {
          return `Empty_${columnName}_${rowIndex}`;
        }
        const str = String(value).trim();
        return str || `Empty_${columnName}_${rowIndex}`;
      }
      /**
       * LEARNING: Statistics for UI display
       * Returns useful information about the current state
       */
      getStatistics() {
        if (!this.csvData) {
          return { hasData: false };
        }
        return {
          hasData: true,
          rowCount: this.csvData.length,
          columnCount: this.csvColumns.length,
          fileName: this.fileName,
          parseWarnings: this.parseWarnings.length,
          parseErrors: this.parseErrors.length
        };
      }
      /**
       * LEARNING: Cleanup method
       * Good practice to provide a way to reset state
       */
      clear() {
        this.csvData = null;
        this.csvColumns = [];
        this.fileName = "";
        this.parseErrors = [];
        this.parseWarnings = [];
      }
      // LEARNING: Getter methods provide clean access to internal state
      // These are read-only properties that external code can access
      get data() {
        return this.csvData;
      }
      get columns() {
        return this.csvColumns;
      }
      get name() {
        return this.fileName;
      }
      get errors() {
        return this.parseErrors;
      }
      get warnings() {
        return this.parseWarnings;
      }
      get hasData() {
        return this.csvData && this.csvData.length > 0;
      }
    };
    module2.exports = CSVProcessor;
  }
});

// src/output-generator.js
var require_output_generator = __commonJS({
  "src/output-generator.js"(exports2, module2) {
    var Utils = require_utils();
    var CONSTANTS2 = require_constants();
    var OutputGenerator = class {
      constructor(app) {
        this.app = app;
      }
      /**
       * Generate JSON output
       * @param {object} processedData - Data from CSVProcessor
       * @returns {string} JSON string
       */
      generateJSON(processedData) {
        try {
          return JSON.stringify(processedData, null, 2);
        } catch (error) {
          throw new Error(`Failed to generate JSON: ${Utils.getErrorMessage(error)}`);
        }
      }
      /**
       * Generate markdown files and return summary
       * @param {object} processedData - Data from CSVProcessor
       * @param {string} outputFolder - Target folder for files
       * @returns {Promise<object>} Generation results
       */
      async generateMarkdownFiles(processedData, outputFolder) {
        const results = {
          successCount: 0,
          errorCount: 0,
          files: [],
          errors: []
        };
        try {
          await this.app.vault.createFolder(outputFolder);
        } catch (e) {
        }
        for (const item of processedData.data) {
          try {
            const content = this._generateMarkdownContent(item, processedData);
            const filepath = `${outputFolder}/${item.filename}`;
            const existingFile = this.app.vault.getAbstractFileByPath(filepath);
            if (existingFile) {
              const newFilepath = this._generateUniqueFilename(outputFolder, item.filename);
              await this.app.vault.create(newFilepath, content);
              results.files.push({ original: item.filename, created: newFilepath });
            } else {
              await this.app.vault.create(filepath, content);
              results.files.push({ original: item.filename, created: filepath });
            }
            results.successCount++;
          } catch (error) {
            results.errorCount++;
            results.errors.push({
              filename: item.filename,
              error: Utils.getErrorMessage(error)
            });
          }
        }
        return results;
      }
      /**
       * Generate unique filename if file already exists
       * @private
       */
      _generateUniqueFilename(folder, filename) {
        const baseName = filename.replace(".md", "");
        let counter = 1;
        let newFilename;
        do {
          newFilename = `${folder}/${baseName}_${counter}.md`;
          counter++;
        } while (this.app.vault.getAbstractFileByPath(newFilename));
        return newFilename;
      }
      /**
       * Generate markdown content for a single item
       * @private
       */
      _generateMarkdownContent(item, processedData) {
        const isDataview = processedData.format === CONSTANTS2.OUTPUT_FORMATS.DATAVIEW;
        const frontmatter = this._generateFrontmatter(item, processedData, isDataview);
        const bodyContent = this._generateMarkdownBody(item, processedData);
        return frontmatter + bodyContent;
      }
      /**
       * Generate YAML frontmatter
       * @private
       */
      _generateFrontmatter(item, processedData, isDataview) {
        let frontmatter = "---\\n";
        processedData.structure.forEach((col) => {
          const fieldName = Utils.sanitizeFieldName(col);
          const value = item.structureData[col] || "";
          frontmatter += `${fieldName}: "${Utils.escapeYAMLString(value)}"\\n`;
        });
        processedData.dataColumns.forEach((col) => {
          const fieldName = Utils.sanitizeFieldName(col);
          const value = item.contentData[col] || "";
          if (typeof value === "boolean") {
            frontmatter += `${fieldName}: ${value}\\n`;
          } else if (typeof value === "number") {
            frontmatter += `${fieldName}: ${value}\\n`;
          } else {
            frontmatter += `${fieldName}: "${Utils.escapeYAMLString(value)}"\\n`;
          }
        });
        frontmatter += `source_file: "${processedData.sourceFile}"\\n`;
        frontmatter += `source_row: ${item.sourceRow}\\n`;
        frontmatter += `imported: ${processedData.generated}\\n`;
        if (isDataview) {
          frontmatter += `type: "${Utils.sanitizeFieldName(processedData.structure[0] || "item")}"\\n`;
          frontmatter += "tags:\\n";
          frontmatter += "  - imported\\n";
          processedData.structure.forEach((col) => {
            const value = item.structureData[col];
            if (value && !Utils.isEmpty(value)) {
              const tagName = Utils.sanitizeTagName(String(value));
              if (tagName) {
                frontmatter += `  - "${tagName}"\\n`;
              }
            }
          });
        }
        frontmatter += "---\\n\\n";
        return frontmatter;
      }
      /**
       * Generate markdown body content
       * @private
       */
      _generateMarkdownBody(item, processedData) {
        const titleParts = processedData.structure.map(
          (col) => item.structureData[col] || "Unknown"
        );
        let content = `# ${titleParts.join(" - ")}\\n\\n`;
        content += "## Overview\\n\\n";
        processedData.structure.forEach((col) => {
          const value = item.structureData[col] || "N/A";
          content += `- **${col}**: ${value}\\n`;
        });
        content += "\\n";
        if (processedData.dataColumns.length > 0) {
          content += "## Details\\n\\n";
          processedData.dataColumns.forEach((col) => {
            const value = item.contentData[col];
            if (!Utils.isEmpty(value)) {
              content += `- **${col}**: ${value}\\n`;
            }
          });
          content += "\\n";
        }
        content += `---\\n\\n`;
        content += `*This note was automatically imported from ${processedData.sourceFile} on ${(/* @__PURE__ */ new Date()).toLocaleDateString()}.*\\n`;
        return content;
      }
      /**
       * Generate preview content for different formats
       * @param {object} structure - Current structure configuration
       * @param {string[]} dataColumns - Available data columns
       * @param {string} outputFormat - Target output format
       * @returns {string} Preview content
       */
      generatePreview(structure, dataColumns, outputFormat) {
        switch (outputFormat) {
          case CONSTANTS2.OUTPUT_FORMATS.JSON:
            return this._generateJSONPreview(structure, dataColumns);
          case CONSTANTS2.OUTPUT_FORMATS.MARKDOWN:
          case CONSTANTS2.OUTPUT_FORMATS.DATAVIEW:
            return this._generateMarkdownPreview(structure, dataColumns, outputFormat);
          default:
            return "Preview not available for this format";
        }
      }
      /**
       * Generate JSON preview
       * @private
       */
      _generateJSONPreview(structure, dataColumns) {
        if (structure.length === 0) {
          return "{}";
        }
        let example = {};
        let current = example;
        structure.forEach((col, index) => {
          const exampleValue = `Example_${col}_Value`;
          if (index === structure.length - 1) {
            current[exampleValue] = {};
            dataColumns.forEach((dataCol) => {
              current[exampleValue][dataCol] = `Sample ${dataCol} data`;
            });
            current[exampleValue]._metadata = {
              sourceRow: 1,
              structurePath: structure.map((c) => `Example_${c}_Value`).join(" \u2192 ")
            };
          } else {
            current[exampleValue] = {};
            current = current[exampleValue];
          }
        });
        return JSON.stringify({
          metadata: {
            structure: structure.join(" \u2192 "),
            dataColumns,
            totalEntries: "...",
            generated: (/* @__PURE__ */ new Date()).toISOString()
          },
          data: example
        }, null, 2);
      }
      /**
       * Generate markdown preview
       * @private
       */
      _generateMarkdownPreview(structure, dataColumns, outputFormat) {
        const isDataview = outputFormat === CONSTANTS2.OUTPUT_FORMATS.DATAVIEW;
        let frontmatter = "---\\n";
        structure.forEach((col) => {
          const fieldName = Utils.sanitizeFieldName(col);
          frontmatter += `${fieldName}: "Example_${col}_Value"\\n`;
        });
        dataColumns.forEach((col) => {
          const fieldName = Utils.sanitizeFieldName(col);
          frontmatter += `${fieldName}: "Sample ${col} data"\\n`;
        });
        frontmatter += `source_file: "example.csv"\\n`;
        frontmatter += `imported: ${(/* @__PURE__ */ new Date()).toISOString()}\\n`;
        if (isDataview) {
          frontmatter += `type: ${Utils.sanitizeFieldName(structure[0] || "item")}\\n`;
          frontmatter += "tags:\\n";
          frontmatter += "  - imported\\n";
          structure.forEach((col) => {
            frontmatter += `  - ${Utils.sanitizeFieldName(col)}\\n`;
          });
        }
        frontmatter += "---\\n\\n";
        const titleParts = structure.map((col) => `{{${Utils.sanitizeFieldName(col)}}}`);
        frontmatter += `# ${titleParts.join(" - ")}\\n\\n`;
        frontmatter += `This note was imported from {{source_file}} on {{imported}}.\\n`;
        return frontmatter;
      }
      /**
       * Create summary report for markdown generation
       * @param {object} results - Generation results
       * @param {string} outputFolder - Output folder path
       * @returns {string} Summary content
       */
      createSummaryReport(results, outputFolder) {
        let summary = `# Markdown Generation Results\\n\\n`;
        summary += `**Output Folder**: ${outputFolder}\\n`;
        summary += `**Total Processed**: ${results.files.length}\\n`;
        summary += `**Successful**: ${results.successCount}\\n`;
        summary += `**Errors**: ${results.errorCount}\\n\\n`;
        if (results.errorCount > 0) {
          summary += `## Errors\\n\\n`;
          results.errors.forEach((error) => {
            summary += `- ${error.filename}: ${error.error}\\n`;
          });
          summary += "\\n";
        }
        summary += `## Created Files\\n\\n`;
        results.files.forEach((file) => {
          summary += `- ${file.created}\\n`;
        });
        return summary;
      }
    };
    module2.exports = OutputGenerator;
  }
});

// src/template-manager.js
var require_template_manager = __commonJS({
  "src/template-manager.js"(exports2, module2) {
    var Utils = require_utils();
    var TemplateManager = class {
      constructor(plugin) {
        this.plugin = plugin;
        this.templates = {};
      }
      /**
       * Load templates from plugin data
       * @returns {Promise<void>}
       */
      async loadTemplates() {
        try {
          const saved = await this.plugin.loadData();
          this.templates = saved && saved.templates ? saved.templates : {};
        } catch (error) {
          console.error("Failed to load templates:", error);
          this.templates = {};
        }
      }
      /**
       * Save current templates to plugin data
       * @returns {Promise<boolean>} Success status
       */
      async saveTemplates() {
        try {
          await this.plugin.saveData({ templates: this.templates });
          return true;
        } catch (error) {
          console.error("Failed to save templates:", error);
          return false;
        }
      }
      /**
       * Save a new template
       * @param {string} name - Template name
       * @param {object} config - Template configuration
       * @returns {Promise<boolean>} Success status
       */
      async saveTemplate(name, config) {
        if (!name || typeof name !== "string") {
          throw new Error("Template name must be a non-empty string");
        }
        if (!config || !config.structure || !Array.isArray(config.structure)) {
          throw new Error("Template must include a valid structure array");
        }
        this._validateTemplateConfig(config);
        const template = {
          name: name.trim(),
          structure: [...config.structure],
          excluded: [...config.excluded || []],
          created: (/* @__PURE__ */ new Date()).toISOString(),
          lastUsed: (/* @__PURE__ */ new Date()).toISOString(),
          description: config.description || "",
          metadata: {
            version: "1.0",
            columnCount: config.structure.length,
            excludedCount: (config.excluded || []).length
          }
        };
        this.templates[name] = template;
        return await this.saveTemplates();
      }
      /**
       * Load a template by name
       * @param {string} name - Template name
       * @returns {object|null} Template configuration or null if not found
       */
      getTemplate(name) {
        const template = this.templates[name];
        if (template) {
          template.lastUsed = (/* @__PURE__ */ new Date()).toISOString();
          this.saveTemplates();
          return Utils.deepClone(template);
        }
        return null;
      }
      /**
       * Delete a template
       * @param {string} name - Template name
       * @returns {Promise<boolean>} Success status
       */
      async deleteTemplate(name) {
        if (this.templates[name]) {
          delete this.templates[name];
          return await this.saveTemplates();
        }
        return true;
      }
      /**
       * Get all template names
       * @returns {string[]} Array of template names
       */
      getTemplateNames() {
        return Object.keys(this.templates).sort();
      }
      /**
       * Get all templates with metadata
       * @returns {object[]} Array of template objects
       */
      getAllTemplates() {
        return Object.entries(this.templates).map(([name, template]) => ({
          name,
          ...template
        })).sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed));
      }
      /**
       * Check if template name exists
       * @param {string} name - Template name
       * @returns {boolean} True if template exists
       */
      templateExists(name) {
        return this.templates.hasOwnProperty(name);
      }
      /**
       * Validate template against current CSV columns
       * @param {string} templateName - Name of template to validate
       * @param {string[]} availableColumns - Currently available CSV columns
       * @returns {object} Validation results
       */
      validateTemplate(templateName, availableColumns) {
        const template = this.templates[templateName];
        if (!template) {
          return {
            valid: false,
            error: "Template not found",
            missingColumns: [],
            warnings: []
          };
        }
        const missingColumns = template.structure.filter(
          (col) => !availableColumns.includes(col)
        );
        const missingExcluded = template.excluded.filter(
          (col) => !availableColumns.includes(col)
        );
        const warnings = [];
        if (missingExcluded.length > 0) {
          warnings.push(`Excluded columns no longer available: ${missingExcluded.join(", ")}`);
        }
        return {
          valid: missingColumns.length === 0,
          error: missingColumns.length > 0 ? `Missing columns: ${missingColumns.join(", ")}` : null,
          missingColumns,
          warnings,
          availableColumns: template.structure.filter((col) => availableColumns.includes(col)),
          availableExcluded: template.excluded.filter((col) => availableColumns.includes(col))
        };
      }
      /**
       * Export templates to JSON string
       * @returns {string} JSON representation of all templates
       */
      exportTemplates() {
        return JSON.stringify({
          version: "1.0",
          exportDate: (/* @__PURE__ */ new Date()).toISOString(),
          templates: this.templates
        }, null, 2);
      }
      /**
       * Import templates from JSON string
       * @param {string} jsonString - JSON string containing templates
       * @returns {Promise<object>} Import results
       */
      async importTemplates(jsonString) {
        try {
          const data = JSON.parse(jsonString);
          if (!data.templates || typeof data.templates !== "object") {
            throw new Error("Invalid template file format");
          }
          const results = {
            imported: 0,
            skipped: 0,
            errors: []
          };
          for (const [name, template] of Object.entries(data.templates)) {
            try {
              this._validateTemplateConfig(template);
              if (this.templates[name]) {
                results.skipped++;
                continue;
              }
              this.templates[name] = {
                ...template,
                imported: (/* @__PURE__ */ new Date()).toISOString()
              };
              results.imported++;
            } catch (error) {
              results.errors.push(`Template "${name}": ${Utils.getErrorMessage(error)}`);
            }
          }
          await this.saveTemplates();
          return results;
        } catch (error) {
          throw new Error(`Failed to import templates: ${Utils.getErrorMessage(error)}`);
        }
      }
      /**
       * Get template usage statistics
       * @returns {object} Usage statistics
       */
      getUsageStatistics() {
        const templates = this.getAllTemplates();
        const now = /* @__PURE__ */ new Date();
        return {
          total: templates.length,
          mostRecentlyUsed: templates.length > 0 ? templates[0].name : null,
          usedThisWeek: templates.filter((t) => {
            const lastUsed = new Date(t.lastUsed);
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1e3);
            return lastUsed > weekAgo;
          }).length,
          averageStructureLength: templates.length > 0 ? Math.round(templates.reduce((sum, t) => sum + t.structure.length, 0) / templates.length) : 0
        };
      }
      /**
       * Validate template configuration
       * @private
       * @param {object} config - Template configuration to validate
       */
      _validateTemplateConfig(config) {
        if (!config.structure || !Array.isArray(config.structure)) {
          throw new Error("Template structure must be an array");
        }
        if (config.structure.length === 0) {
          throw new Error("Template structure cannot be empty");
        }
        if (config.excluded && !Array.isArray(config.excluded)) {
          throw new Error("Template excluded columns must be an array");
        }
        const duplicates = config.structure.filter(
          (col, index) => config.structure.indexOf(col) !== index
        );
        if (duplicates.length > 0) {
          throw new Error(`Duplicate columns in structure: ${duplicates.join(", ")}`);
        }
        const structureSet = new Set(config.structure);
        const conflictingColumns = (config.excluded || []).filter(
          (col) => structureSet.has(col)
        );
        if (conflictingColumns.length > 0) {
          throw new Error(`Columns cannot be both in structure and excluded: ${conflictingColumns.join(", ")}`);
        }
      }
      /**
       * Clear all templates
       * @returns {Promise<boolean>} Success status
       */
      async clearAllTemplates() {
        this.templates = {};
        return await this.saveTemplates();
      }
    };
    module2.exports = TemplateManager;
  }
});

// src/csv-converter-controller.js
var require_csv_converter_controller = __commonJS({
  "src/csv-converter-controller.js"(exports2, module2) {
    var CSVProcessor = require_csv_processor();
    var OutputGenerator = require_output_generator();
    var TemplateManager = require_template_manager();
    var Utils = require_utils();
    var CONSTANTS2 = require_constants();
    var CSVConverterController2 = class {
      constructor(app, plugin) {
        this.app = app;
        this.plugin = plugin;
        this.csvProcessor = new CSVProcessor();
        this.outputGenerator = new OutputGenerator(app);
        this.templateManager = new TemplateManager(plugin);
        this.state = {
          currentStructure: [],
          // User's column arrangement
          excludedColumns: [],
          // Columns to ignore
          outputFormat: CONSTANTS2.OUTPUT_FORMATS.JSON,
          // Default output format
          outputFolder: "",
          // Where to save files
          lastProcessedData: null
          // Cache of last result
        };
        this.listeners = /* @__PURE__ */ new Map();
      }
      /**
       * LEARNING: Initialization pattern
       * Some setup needs to happen after construction (like loading saved data)
       */
      async initialize() {
        await this.templateManager.loadTemplates();
        this.emit("initialized");
      }
      /**
       * LEARNING: File loading with error handling
       * Notice how this method handles both success and failure gracefully
       */
      async loadCSVFile(file) {
        try {
          const content = await this.app.vault.read(file);
          const result = await this.csvProcessor.parseCSV(content, file.basename);
          if (result.success) {
            this.state.currentStructure = [];
            this.state.excludedColumns = [];
            this.emit("fileLoaded", {
              file,
              columns: this.csvProcessor.columns,
              rowCount: result.rowCount,
              warnings: result.warnings
            });
          }
          return result;
        } catch (error) {
          const errorResult = {
            success: false,
            error: Utils.getErrorMessage(error)
          };
          this.emit("error", errorResult);
          return errorResult;
        }
      }
      /**
       * LEARNING: Simple delegation method
       * Controller doesn't need to know HOW to get CSV files, just that it needs them
       */
      getCSVFiles() {
        return this.app.vault.getFiles().filter((file) => file.extension === "csv").sort((a, b) => a.path.localeCompare(b.path));
      }
      /**
       * LEARNING: State management with event notification
       * When state changes, notify anyone who cares
       */
      updateStructure(structure, excluded = []) {
        this.state.currentStructure = [...structure];
        this.state.excludedColumns = [...excluded];
        this.emit("structureChanged", {
          structure: this.state.currentStructure,
          excluded: this.state.excludedColumns,
          isValid: this.isStructureValid()
        });
      }
      /**
       * LEARNING: Command pattern methods
       * Each user action becomes a method that modifies state and emits events
       */
      addToStructure(column, position = -1) {
        if (!this.csvProcessor.columns.includes(column)) {
          throw new Error(`Column "${column}" not found in CSV data`);
        }
        this.state.excludedColumns = this.state.excludedColumns.filter((col) => col !== column);
        if (position >= 0 && position < this.state.currentStructure.length) {
          this.state.currentStructure.splice(position, 0, column);
        } else {
          this.state.currentStructure.push(column);
        }
        this.emit("structureChanged", {
          structure: this.state.currentStructure,
          excluded: this.state.excludedColumns,
          isValid: this.isStructureValid()
        });
      }
      removeFromStructure(column) {
        this.state.currentStructure = this.state.currentStructure.filter((col) => col !== column);
        this.emit("structureChanged", {
          structure: this.state.currentStructure,
          excluded: this.state.excludedColumns,
          isValid: this.isStructureValid()
        });
      }
      addToExcluded(column) {
        if (!this.csvProcessor.columns.includes(column)) {
          throw new Error(`Column "${column}" not found in CSV data`);
        }
        this.state.currentStructure = this.state.currentStructure.filter((col) => col !== column);
        if (!this.state.excludedColumns.includes(column)) {
          this.state.excludedColumns.push(column);
        }
        this.emit("structureChanged", {
          structure: this.state.currentStructure,
          excluded: this.state.excludedColumns,
          isValid: this.isStructureValid()
        });
      }
      removeFromExcluded(column) {
        this.state.excludedColumns = this.state.excludedColumns.filter((col) => col !== column);
        this.emit("structureChanged", {
          structure: this.state.currentStructure,
          excluded: this.state.excludedColumns,
          isValid: this.isStructureValid()
        });
      }
      /**
       * LEARNING: Preset application
       * Shows how to use constants for configuration
       */
      applyPreset(presetId) {
        const preset = CONSTANTS2.PRESETS[presetId.toUpperCase()];
        if (!preset) {
          throw new Error(`Unknown preset: ${presetId}`);
        }
        let structure = [];
        if (preset.id === "simple") {
          structure = this.csvProcessor.columns.slice(0, 2);
        } else {
          structure = preset.columns.filter(
            (col) => this.csvProcessor.columns.includes(col)
          );
        }
        this.updateStructure(structure, []);
        this.emit("presetApplied", {
          presetId,
          structure,
          matchedColumns: structure.length
        });
      }
      clearStructure() {
        this.updateStructure([], []);
      }
      /**
       * LEARNING: Format selection with validation
       */
      setOutputFormat(format) {
        if (!Object.values(CONSTANTS2.OUTPUT_FORMATS).includes(format)) {
          throw new Error(`Invalid output format: ${format}`);
        }
        this.state.outputFormat = format;
        this.emit("outputFormatChanged", format);
      }
      setOutputFolder(folder) {
        this.state.outputFolder = folder;
      }
      /**
       * LEARNING: Delegation to appropriate module
       * Controller doesn't generate previews, it delegates to OutputGenerator
       */
      generatePreview() {
        if (!this.isStructureValid()) {
          return "Configure structure to see preview...";
        }
        const dataColumns = this.getDataColumns();
        return this.outputGenerator.generatePreview(
          this.state.currentStructure,
          dataColumns,
          this.state.outputFormat
        );
      }
      /**
       * LEARNING: Main processing coordination
       * Controller orchestrates the work but doesn't do it
       */
      async processData() {
        if (!this.csvProcessor.hasData) {
          throw new Error("No CSV data loaded");
        }
        if (!this.isStructureValid()) {
          throw new Error("Invalid structure configuration");
        }
        try {
          const processedData = this.csvProcessor.processData({
            structure: this.state.currentStructure,
            excludedColumns: this.state.excludedColumns,
            outputFormat: this.state.outputFormat
          });
          this.state.lastProcessedData = processedData;
          let result;
          if (this.state.outputFormat === CONSTANTS2.OUTPUT_FORMATS.JSON) {
            result = {
              type: "json",
              content: this.outputGenerator.generateJSON(processedData),
              data: processedData
            };
          } else {
            const outputFolder = this.state.outputFolder || `Imported/${this.csvProcessor.name}`;
            const markdownResults = await this.outputGenerator.generateMarkdownFiles(processedData, outputFolder);
            result = {
              type: "markdown",
              folder: outputFolder,
              results: markdownResults,
              summary: this.outputGenerator.createSummaryReport(markdownResults, outputFolder)
            };
          }
          this.emit("dataProcessed", result);
          return result;
        } catch (error) {
          const errorResult = {
            success: false,
            error: Utils.getErrorMessage(error)
          };
          this.emit("error", errorResult);
          throw error;
        }
      }
      /**
       * LEARNING: File saving coordination
       */
      async saveToVault(processResult) {
        try {
          let savedPath;
          if (processResult.type === "json") {
            const fileName = `${this.csvProcessor.name || "data"}_structured.json`;
            await this.app.vault.create(fileName, processResult.content);
            savedPath = fileName;
          } else {
            const summaryFile = `${processResult.folder}/_import_summary.md`;
            await this.app.vault.create(summaryFile, processResult.summary);
            savedPath = summaryFile;
          }
          this.emit("fileSaved", savedPath);
          return savedPath;
        } catch (error) {
          throw new Error(`Failed to save to vault: ${Utils.getErrorMessage(error)}`);
        }
      }
      /**
       * LEARNING: Template management delegation
       */
      async saveTemplate(name, description = "") {
        if (!this.isStructureValid()) {
          throw new Error("Cannot save invalid structure as template");
        }
        const success = await this.templateManager.saveTemplate(name, {
          structure: this.state.currentStructure,
          excluded: this.state.excludedColumns,
          description
        });
        if (success) {
          this.emit("templateSaved", name);
        }
        return success;
      }
      loadTemplate(name) {
        const template = this.templateManager.getTemplate(name);
        if (!template) {
          return false;
        }
        const validation = this.templateManager.validateTemplate(name, this.csvProcessor.columns);
        if (!validation.valid) {
          this.emit("templateValidationFailed", {
            name,
            error: validation.error,
            missingColumns: validation.missingColumns
          });
          return false;
        }
        this.updateStructure(
          validation.availableColumns,
          validation.availableExcluded
        );
        this.emit("templateLoaded", {
          name,
          warnings: validation.warnings
        });
        return true;
      }
      async deleteTemplate(name) {
        const success = await this.templateManager.deleteTemplate(name);
        if (success) {
          this.emit("templateDeleted", name);
        }
        return success;
      }
      // LEARNING: Getter properties for clean access to state
      get csvFiles() {
        return this.getCSVFiles();
      }
      get currentFile() {
        return this.csvProcessor.name;
      }
      get columns() {
        return this.csvProcessor.columns;
      }
      get hasData() {
        return this.csvProcessor.hasData;
      }
      get structure() {
        return [...this.state.currentStructure];
      }
      // Safe copy
      get excludedColumns() {
        return [...this.state.excludedColumns];
      }
      get outputFormat() {
        return this.state.outputFormat;
      }
      get outputFolder() {
        return this.state.outputFolder;
      }
      get templates() {
        return this.templateManager.getAllTemplates();
      }
      /**
       * LEARNING: Computed properties
       * These calculate values based on current state
       */
      getDataColumns() {
        return this.csvProcessor.columns.filter(
          (col) => !this.state.currentStructure.includes(col) && !this.state.excludedColumns.includes(col)
        );
      }
      isStructureValid() {
        return this.csvProcessor.hasData && this.state.currentStructure.length > 0;
      }
      getStatistics() {
        const csvStats = this.csvProcessor.getStatistics();
        return {
          ...csvStats,
          // LEARNING: Spread operator to merge objects
          structureLength: this.state.currentStructure.length,
          excludedCount: this.state.excludedColumns.length,
          dataColumns: this.getDataColumns().length,
          isReady: this.isStructureValid()
        };
      }
      /**
       * LEARNING: Event system implementation
       * This is a simple observer pattern - objects can listen for events
       */
      on(event, callback) {
        if (!this.listeners.has(event)) {
          this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
      }
      off(event, callback) {
        if (!this.listeners.has(event)) return;
        const callbacks = this.listeners.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
      emit(event, data) {
        if (!this.listeners.has(event)) return;
        this.listeners.get(event).forEach((callback) => {
          try {
            callback(data);
          } catch (error) {
            console.error(`Error in event listener for ${event}:`, error);
          }
        });
      }
      /**
       * LEARNING: Cleanup method
       * Good practice to clean up resources when done
       */
      destroy() {
        this.listeners.clear();
        this.csvProcessor.clear();
        this.state.lastProcessedData = null;
      }
    };
    module2.exports = CSVConverterController2;
  }
});

// src/main.js
var { Plugin, Modal, Notice, Setting, TFile } = require("obsidian");
var CSVConverterController = require_csv_converter_controller();
var CONSTANTS = require_constants();
var CSVtoJSONPlugin = class extends Plugin {
  async onload() {
    console.log("CSV to JSON Converter plugin loaded");
    this.addCommand({
      id: "open-csv-json-converter",
      name: "Open CSV to JSON Converter",
      callback: () => {
        new CSVtoJSONModal(this.app, this).open();
      }
    });
    this.addRibbonIcon("file-spreadsheet", "CSV to JSON Converter", () => {
      new CSVtoJSONModal(this.app, this).open();
    });
    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        if (file instanceof TFile && file.extension === "csv") {
          menu.addItem((item) => {
            item.setTitle("Convert to JSON").setIcon("file-spreadsheet").onClick(async () => {
              const modal = new CSVtoJSONModal(this.app, this);
              modal.open();
              setTimeout(() => modal.selectFile(file), 100);
            });
          });
        }
      })
    );
  }
  onunload() {
    console.log("CSV to JSON Converter plugin unloaded");
  }
};
var CSVtoJSONModal = class extends Modal {
  constructor(app, plugin) {
    super(app);
    this.plugin = plugin;
    this.controller = new CSVConverterController(app, plugin);
    this.setupEventListeners();
  }
  async onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass(CONSTANTS.CSS_CLASSES.MODAL);
    this.addStyles();
    await this.controller.initialize();
    this.createInterface();
  }
  setupEventListeners() {
    this.controller.on("fileLoaded", (data) => {
      this.updateFilePreview(data);
      this.updateUI();
    });
    this.controller.on("structureChanged", (data) => {
      this.updateStructureDisplay();
      this.updatePreview();
      this.updateProcessButton();
    });
    this.controller.on("outputFormatChanged", () => {
      this.updateFormatOptions();
      this.updatePreview();
    });
    this.controller.on("dataProcessed", (result) => {
      this.showResults(result);
    });
    this.controller.on("error", (error) => {
      new Notice(`Error: ${error.error}`);
    });
    this.controller.on("templateSaved", (name) => {
      new Notice(`Template "${name}" saved successfully`);
      this.updateTemplateList();
    });
    this.controller.on("templateLoaded", (data) => {
      new Notice(`Template "${data.name}" loaded`);
      if (data.warnings.length > 0) {
        new Notice(`Warnings: ${data.warnings.join(", ")}`);
      }
    });
  }
  createInterface() {
    const { contentEl } = this;
    const container = contentEl.createDiv(CONSTANTS.CSS_CLASSES.CONTAINER);
    container.createEl("h2", {
      text: "CSV to JSON Converter",
      cls: "csv-json-title"
    });
    this.createFileSelection(container);
    this.createStructureBuilder(container);
    this.createFormatSelection(container);
    this.createPreview(container);
    this.createOutputSection(container);
  }
  createFileSelection(container) {
    const step = container.createDiv(CONSTANTS.CSS_CLASSES.STEP);
    step.createEl("h3", { text: "Step 1: Select CSV File" });
    const fileGrid = step.createDiv("csv-json-file-grid");
    const fileSection = fileGrid.createDiv("csv-json-file-section");
    fileSection.createEl("h4", { text: "CSV Files in Vault:" });
    this.fileListEl = fileSection.createDiv("csv-json-file-list");
    this.loadFileList();
    const previewSection = fileGrid.createDiv();
    previewSection.createEl("h4", { text: "File Preview:" });
    this.filePreviewEl = previewSection.createDiv("csv-json-columns-preview");
    this.filePreviewEl.createDiv({
      text: "Select a CSV file to see preview..."
    });
  }
  createStructureBuilder(container) {
    const step = container.createDiv(CONSTANTS.CSS_CLASSES.STEP);
    step.createEl("h3", { text: "Step 2: Design Structure" });
    this.createTemplateSection(step);
    this.createPresetButtons(step);
    this.availableColumnsEl = step.createDiv("csv-json-available-columns");
    this.updateAvailableColumns();
    step.createEl("h4", { text: "Structure (drag columns here):" });
    this.structureEl = step.createDiv("csv-json-nesting-levels");
    this.setupDropZone(this.structureEl, "structure");
    step.createEl("h4", { text: "Excluded Columns:" });
    this.excludedEl = step.createDiv("csv-json-excluded-zone");
    this.setupDropZone(this.excludedEl, "excluded");
    this.updateStructureDisplay();
  }
  createFormatSelection(container) {
    const step = container.createDiv(CONSTANTS.CSS_CLASSES.STEP);
    step.createEl("h3", { text: "Step 3: Choose Output Format" });
    const formatSelector = step.createDiv("csv-json-format-selector");
    Object.entries(CONSTANTS.OUTPUT_FORMATS).forEach(([key, value]) => {
      const option = formatSelector.createDiv("csv-json-format-option");
      if (value === this.controller.outputFormat) {
        option.addClass(CONSTANTS.CSS_CLASSES.ACTIVE);
      }
      const descriptions = {
        json: "Standard JSON format",
        markdown: "Individual markdown files",
        dataview: "Dataview-optimized format"
      };
      option.createEl("strong", { text: key });
      option.createEl("div", { text: descriptions[value] });
      option.addEventListener("click", () => {
        formatSelector.querySelectorAll(".csv-json-format-option").forEach((opt) => opt.removeClass(CONSTANTS.CSS_CLASSES.ACTIVE));
        option.addClass(CONSTANTS.CSS_CLASSES.ACTIVE);
        this.controller.setOutputFormat(value);
      });
    });
    this.formatOptionsEl = step.createDiv();
    this.updateFormatOptions();
  }
  createPreview(container) {
    this.previewEl = container.createDiv("csv-json-preview");
    this.previewEl.style.display = "none";
    this.previewEl.createEl("h4", { text: "Preview" });
    this.previewContentEl = this.previewEl.createDiv("csv-json-json-preview");
  }
  createOutputSection(container) {
    this.outputSection = container.createDiv("csv-json-output-section");
    this.outputSection.style.display = "none";
    this.outputSection.createEl("h3", { text: "Results" });
    this.statsEl = this.outputSection.createDiv();
    this.outputContentEl = this.outputSection.createEl("textarea", {
      cls: "csv-json-textarea"
    });
    const controls = this.outputSection.createDiv("csv-json-output-controls");
    this.processBtn = controls.createEl("button", {
      text: "Generate Output",
      cls: "csv-json-process-btn"
    });
    this.processBtn.addEventListener("click", () => this.processData());
    const saveBtn = controls.createEl("button", {
      text: "Save to Vault",
      cls: "csv-json-btn csv-json-btn-primary"
    });
    saveBtn.addEventListener("click", () => this.saveToVault());
    const copyBtn = controls.createEl("button", {
      text: "Copy to Clipboard",
      cls: "csv-json-btn csv-json-btn-secondary"
    });
    copyBtn.addEventListener("click", () => this.copyToClipboard());
    this.updateProcessButton();
  }
  // Simplified event handlers using controller
  loadFileList() {
    this.fileListEl.empty();
    const files = this.controller.csvFiles;
    if (files.length === 0) {
      this.fileListEl.createDiv({ text: "No CSV files found in vault" });
      return;
    }
    files.forEach((file) => {
      const fileItem = this.fileListEl.createDiv("csv-json-file-item");
      fileItem.textContent = file.path;
      fileItem.addEventListener("click", () => this.selectFile(file, fileItem));
    });
  }
  async selectFile(file, element = null) {
    if (element) {
      this.fileListEl.querySelectorAll(".csv-json-file-item").forEach((item) => item.removeClass("selected"));
      element.addClass("selected");
    }
    const result = await this.controller.loadCSVFile(file);
    if (result.success) {
      new Notice(
        `CSV loaded: ${result.rowCount} rows, ${this.controller.columns.length} columns`
      );
    } else {
      new Notice(`Error loading file: ${result.error}`);
    }
  }
  updateFilePreview(data) {
    this.filePreviewEl.empty();
    this.filePreviewEl.createEl("h4", { text: "Available Columns:" });
    const display = this.filePreviewEl.createDiv();
    data.columns.forEach((col) => {
      const span = display.createSpan({
        text: col,
        cls: "csv-json-column-preview"
      });
    });
    if (data.warnings.length > 0) {
      const warningDiv = this.filePreviewEl.createDiv("csv-json-warning");
      warningDiv.createEl("strong", { text: "\u26A0\uFE0F Warnings:" });
      const list = warningDiv.createEl("ul");
      data.warnings.forEach((warning) => {
        list.createEl("li", { text: warning });
      });
    }
    this.updateAvailableColumns();
  }
  updateAvailableColumns() {
    this.availableColumnsEl.empty();
    this.availableColumnsEl.createEl("h4", { text: "Available Columns:" });
    if (this.controller.columns.length === 0) {
      this.availableColumnsEl.createDiv({ text: "Select a file first..." });
      return;
    }
    this.controller.columns.forEach((col) => {
      const tag = this.availableColumnsEl.createSpan({
        text: col,
        cls: CONSTANTS.CSS_CLASSES.COLUMN_TAG
      });
      tag.draggable = true;
      tag.dataset.column = col;
      if (this.controller.structure.includes(col)) {
        tag.addClass(CONSTANTS.CSS_CLASSES.USED);
      } else if (this.controller.excludedColumns.includes(col)) {
        tag.addClass(CONSTANTS.CSS_CLASSES.EXCLUDED);
      }
      this.setupDragHandlers(tag);
    });
  }
  updateStructureDisplay() {
    this.structureEl.empty();
    if (this.controller.structure.length === 0) {
      this.structureEl.createDiv("csv-json-empty-drop-zone").innerHTML = "Drag columns here to build structure";
    } else {
      this.controller.structure.forEach((col, index) => {
        const level = this.structureEl.createDiv(CONSTANTS.CSS_CLASSES.LEVEL);
        const content = level.createDiv("csv-json-level-content");
        content.createDiv("csv-json-level-number").textContent = (index + 1).toString();
        content.createEl("strong").textContent = col;
        const removeBtn = level.createEl("button", {
          text: "\u2715",
          cls: "csv-json-remove-btn"
        });
        removeBtn.addEventListener("click", () => {
          this.controller.removeFromStructure(col);
        });
      });
    }
    this.excludedEl.empty();
    const dropZone = this.excludedEl.createDiv("csv-json-excluded-drop-zone");
    if (this.controller.excludedColumns.length === 0) {
      dropZone.textContent = "Drag columns here to exclude";
    } else {
      this.controller.excludedColumns.forEach((col) => {
        const item = dropZone.createDiv("csv-json-excluded-item");
        item.createEl("span").textContent = col;
        const restoreBtn = item.createEl("button", {
          text: "Restore",
          cls: "csv-json-remove-btn"
        });
        restoreBtn.addEventListener("click", () => {
          this.controller.removeFromExcluded(col);
        });
      });
    }
  }
  updatePreview() {
    if (!this.controller.isStructureValid()) {
      this.previewEl.style.display = "none";
      return;
    }
    this.previewEl.style.display = "block";
    this.previewContentEl.textContent = this.controller.generatePreview();
  }
  updateProcessButton() {
    this.processBtn.disabled = !this.controller.isStructureValid();
    this.processBtn.textContent = this.controller.isStructureValid() ? "Generate Output" : "Configure structure first";
  }
  async processData() {
    try {
      this.lastResult = await this.controller.processData();
      new Notice("Processing completed successfully!");
    } catch (error) {
      new Notice(`Processing failed: ${error.message}`);
    }
  }
  showResults(result) {
    this.outputSection.style.display = "block";
    if (result.type === "json") {
      this.outputContentEl.value = result.content;
      this.statsEl.innerHTML = `<h4>JSON Generated</h4><p>Data structure created successfully</p>`;
    } else {
      this.outputContentEl.value = result.summary;
      this.statsEl.innerHTML = `
        <h4>Markdown Files Created</h4>
        <p>Successfully created ${result.results.successCount} files in ${result.folder}</p>
        ${result.results.errorCount > 0 ? `<p style="color: var(--text-error)">Errors: ${result.results.errorCount}</p>` : ""}
      `;
    }
  }
  async saveToVault() {
    if (!this.lastResult) return;
    try {
      const savedPath = await this.controller.saveToVault(this.lastResult);
      new Notice(`Saved to ${savedPath}`);
    } catch (error) {
      new Notice(`Save failed: ${error.message}`);
    }
  }
  async copyToClipboard() {
    if (!this.outputContentEl.value) return;
    try {
      await navigator.clipboard.writeText(this.outputContentEl.value);
      new Notice("Copied to clipboard!");
    } catch (error) {
      new Notice("Failed to copy to clipboard");
    }
  }
  // Helper methods for UI updates
  updateUI() {
    this.updateAvailableColumns();
    this.updateStructureDisplay();
    this.updatePreview();
    this.updateProcessButton();
  }
  updateFormatOptions() {
    this.formatOptionsEl.empty();
    if (this.controller.outputFormat !== CONSTANTS.OUTPUT_FORMATS.JSON) {
      new Setting(this.formatOptionsEl).setName("Output Folder").setDesc("Where to save the generated files").addText((text) => {
        text.setPlaceholder("e.g., Imported/Data").setValue(this.controller.outputFolder).onChange((value) => this.controller.setOutputFolder(value));
      });
    }
  }
  // Template management (simplified)
  createTemplateSection(container) {
    const templateDiv = container.createDiv();
    templateDiv.createEl("h4", { text: "Templates:" });
    this.templateListEl = templateDiv.createDiv("csv-json-template-list");
    this.updateTemplateList();
    const saveBtn = templateDiv.createEl("button", {
      text: "\u{1F4BE} Save Template",
      cls: "csv-json-preset-btn save-template"
    });
    saveBtn.addEventListener("click", () => this.saveCurrentTemplate());
  }
  updateTemplateList() {
    this.templateListEl.empty();
    const templates = this.controller.templates;
    if (templates.length === 0) {
      this.templateListEl.createDiv({ text: "No saved templates" });
      return;
    }
    templates.forEach((template) => {
      const item = this.templateListEl.createDiv("csv-json-template-item");
      const nameSpan = item.createSpan({ text: template.name });
      nameSpan.addEventListener("click", () => {
        this.controller.loadTemplate(template.name);
      });
      const deleteBtn = item.createSpan({
        text: "\u2715",
        cls: "csv-json-template-delete"
      });
      deleteBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (confirm(`Delete template "${template.name}"?`)) {
          await this.controller.deleteTemplate(template.name);
          this.updateTemplateList();
        }
      });
    });
  }
  async saveCurrentTemplate() {
    if (!this.controller.isStructureValid()) {
      new Notice("No structure to save as template");
      return;
    }
    const name = await this.promptForTemplateName();
    if (name) {
      await this.controller.saveTemplate(name);
      this.updateTemplateList();
    }
  }
  async promptForTemplateName() {
    return new Promise((resolve) => {
      const modal = new Modal(this.app);
      modal.titleEl.setText("Save Template");
      let inputValue = "";
      new Setting(modal.contentEl).setName("Template Name").addText((text) => {
        text.onChange((value) => inputValue = value);
        setTimeout(() => text.inputEl.focus(), 50);
      });
      new Setting(modal.contentEl).addButton(
        (btn) => btn.setButtonText("Save").setCta().onClick(() => {
          modal.close();
          resolve(inputValue || null);
        })
      ).addButton(
        (btn) => btn.setButtonText("Cancel").onClick(() => {
          modal.close();
          resolve(null);
        })
      );
      modal.open();
    });
  }
  createPresetButtons(container) {
    const presetButtons = container.createDiv("csv-json-preset-buttons");
    Object.entries(CONSTANTS.PRESETS).forEach(([key, preset]) => {
      const btn = presetButtons.createEl("button", {
        text: preset.name,
        cls: "csv-json-preset-btn"
      });
      btn.addEventListener("click", () => {
        this.controller.applyPreset(preset.id);
      });
    });
    const clearBtn = presetButtons.createEl("button", {
      text: "Clear All",
      cls: "csv-json-preset-btn"
    });
    clearBtn.style.background = "var(--text-error)";
    clearBtn.addEventListener("click", () => {
      this.controller.clearStructure();
    });
  }
  // Drag and drop handlers
  setupDragHandlers(element) {
    element.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", e.target.dataset.column);
      e.target.addClass(CONSTANTS.CSS_CLASSES.DRAGGING);
    });
    element.addEventListener("dragend", (e) => {
      e.target.removeClass(CONSTANTS.CSS_CLASSES.DRAGGING);
    });
  }
  setupDropZone(element, type) {
    element.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    });
    element.addEventListener("drop", (e) => {
      e.preventDefault();
      const column = e.dataTransfer.getData("text/plain");
      if (!column) return;
      if (type === "structure") {
        this.controller.addToStructure(column);
      } else if (type === "excluded") {
        this.controller.addToExcluded(column);
      }
    });
  }
  // Add the styles (keeping the original CSS)
  addStyles() {
    if (document.querySelector("#csv-converter-styles")) return;
    const style = document.createElement("style");
    style.id = "csv-converter-styles";
    style.textContent = `
      /* Keeping all the original CSS styles here for brevity */
      .csv-json-modal {
        width: 90vw;
        max-width: 1200px;
        height: 80vh;
        overflow-y: auto;
      }
      
      .csv-json-container {
        padding: 20px;
        font-family: var(--font-ui);
      }
      
      .csv-json-title {
        text-align: center;
        margin-bottom: 30px;
        color: var(--text-normal);
        font-size: 1.8rem;
      }
      
      .csv-json-step {
        margin-bottom: 30px;
        padding: 20px;
        background: var(--background-secondary);
        border-radius: 8px;
        border-left: 4px solid var(--interactive-accent);
      }
      
      .csv-json-step h3 {
        margin-top: 0;
        color: var(--interactive-accent);
        font-size: 1.2rem;
      }
      
      /* Add more CSS classes as needed */
    `;
    document.head.appendChild(style);
  }
  onClose() {
    const { contentEl } = this;
    contentEl.empty();
    this.controller.destroy();
  }
};
module.exports = CSVtoJSONPlugin;
/*! Bundled license information:

papaparse/papaparse.min.js:
  (* @license
  Papa Parse
  v5.5.3
  https://github.com/mholt/PapaParse
  License: MIT
  *)
*/
