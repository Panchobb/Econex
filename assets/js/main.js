(function () {
  var WA = "5491167410993";

  // Menú móvil
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  // Panel del hero: la temperatura baja hasta el setpoint
  var temp = document.getElementById("temp");
  var arc = document.getElementById("arc");
  if (temp && arc) {
    var from = 27.5, to = 22.0, dur = 2400, reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var full = 2 * Math.PI * 50 * 0.75; // arco de 270°
    var pct = function (t) { return (t - 16) / (32 - 16); };
    var setArc = function (t) { arc.style.strokeDasharray = (full * pct(t)).toFixed(1) + " 400"; };
    if (reduce) { temp.textContent = to.toFixed(1); setArc(to); }
    else {
      setArc(from);
      var start = null;
      var step = function (ts) {
        if (!start) start = ts;
        var p = Math.min(1, (ts - start) / dur);
        var e = 1 - Math.pow(1 - p, 3);
        var v = from + (to - from) * e;
        temp.textContent = v.toFixed(1);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(function () { setArc(to); requestAnimationFrame(step); });
    }
  }

  // Formulario de presupuesto: arma el mensaje y lo abre en WhatsApp o en el correo
  var form = document.getElementById("quote-form");
  if (form) {
    var status = document.getElementById("form-status");
    var build = function () {
      var d = new FormData(form);
      var lines = [
        "Hola Econex, quiero pedir un presupuesto.",
        "Nombre: " + (d.get("nombre") || ""),
        d.get("empresa") ? "Empresa / institución: " + d.get("empresa") : "",
        "Servicio: " + (d.get("servicio") || ""),
        d.get("localidad") ? "Localidad: " + d.get("localidad") : "",
        d.get("telefono") ? "Teléfono: " + d.get("telefono") : "",
        d.get("email") ? "Email: " + d.get("email") : "",
        "",
        String(d.get("mensaje") || "")
      ];
      return lines.filter(function (l, i) { return l !== "" || i === 7; }).join("\n");
    };
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var bad = null;
      var check = function (id, errId, msg) {
        var el = document.getElementById(id), er = document.getElementById(errId), ok = el.checkValidity() && el.value.trim() !== "" || (!el.required && el.checkValidity());
        if (el.required && el.value.trim() === "") ok = false;
        el.setAttribute("aria-invalid", ok ? "false" : "true");
        if (er) er.textContent = ok ? "" : msg;
        if (!ok && !bad) bad = el;
      };
      check("f-nombre", "e-nombre", "Escribí tu nombre para saber a quién responder.");
      check("f-email", "e-email", "Revisá el email: falta la @ o el dominio.");
      check("f-msg", "e-msg", "Contanos qué necesitás, aunque sea en una línea.");
      if (bad) { bad.focus(); return; }
      var via = ev.submitter && ev.submitter.value === "email" ? "email" : "wa";
      var msg = build();
      var url = via === "wa"
        ? "https://wa.me/" + WA + "?text=" + encodeURIComponent(msg)
        : "mailto:contacto@econex.com.ar?subject=" + encodeURIComponent("Pedido de presupuesto") + "&body=" + encodeURIComponent(msg);
      if (window.dataLayer) window.dataLayer.push({ event: "generate_lead", channel: via, service: form.servicio.value });
      window.open(url, "_blank", "noopener") || (window.location.href = url);
      if (status) status.textContent = via === "wa"
        ? "Abrimos WhatsApp con tu consulta lista para enviar."
        : "Abrimos tu correo con la consulta lista para enviar.";
    });
  }

  // Medición de clics de contacto (si Google Tag Manager está activo)
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href^='https://wa.me'], a[href^='tel:'], a[href^='mailto:']");
    if (a && window.dataLayer) window.dataLayer.push({ event: "contact_click", href: a.getAttribute("href").split("?")[0] });
  });
})();
