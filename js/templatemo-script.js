const initBg = (autoplay = true) => {
  const bgImgsNames = [
    "diagoona-bg-1.jpg",
    "diagoona-bg-2.jpg",
    "diagoona-bg-3.jpg",
  ];
  const bgImgs = bgImgsNames.map((img) => "img/" + img);

  $.backstretch(bgImgs, { duration: 4000, fade: 500 });

  if (!autoplay) {
    $.backstretch("pause");
  }
};

const setBg = (id) => {
  $.backstretch("show", id);
};

$(document).ready(function () {
  /* =====================
     Background
     ===================== */

  $(".tm-bg-control").on("click", function () {
    $(".tm-bg-control").removeClass("active");
    $(this).addClass("active");
  });

  $(window).on("backstretch.after", function (e, instance, index) {
    $(".tm-bg-control").removeClass("active");
    $(`[data-id=${index}]`).addClass("active");
  });

  /* =====================
   SPA Navigation
   ===================== */
  $(".tm-nav-link").on("click", function (e) {
    e.preventDefault();

    const section = $(this).data("section");
    const $current = $(".tm-content.active");
    const $next = $("#" + section);

    if ($next.is($current)) return;

    // 🔥 ACTUALIZAR NAV ACTIVO
    $(".nav-item").removeClass("active");
    $(this).parent().addClass("active");

    $current.stop(true, true).fadeOut(300, function () {
      $current.removeClass("active");
      $next.addClass("active").hide().fadeIn(450);
    });

    // 🔥 Cerrar menú mobile automáticamente
    $("body").removeClass("menu-open");
  });

  /* =====================
     Mobile menu toggle
     ===================== */
  $(".navbar-toggler").on("click", function () {
    $("body").toggleClass("menu-open");
  });
});
