(function ($) {
  /**
  * Get CSS Breakpoints
  * Usage: window.breakpoint gives you the actual breakpoint
  * E.g.: if(window.breakpoint == 'mobile') { Your Code }
  */
  Drupal.behaviors.getBreakpointsFromCSS = {
    attach: function(context, settings) {
      var breakpoint;
      var breakpoint_refreshValue;
      breakpoint_refreshValue = function () {
        window.breakpoint = window.getComputedStyle(document.querySelector('html'), ':before').getPropertyValue('content').replace(/\"/g, '');
      };

      $(window).resize(function () {
        breakpoint_refreshValue();
      }).resize();
    }
  };

  Drupal.behaviors.menuToggle = {
    attach: function(context, settings) {
      $('.menu-toggle').on('click',function(){
        $('.menu-toggle a').toggleClass('expanded');
        $('.menu--main').toggleClass('expanded');
      });

    }
  };


  /*
* Slow scroll to Anchor
* - https://css-tricks.com/snippets/jquery/smooth-scrolling/
*/

Drupal.behaviors.accordionActiveTrail = {
   attach : function(context, settings) {
    if ($('.path-frontpage')) {
      $(function() {
        $('.menu--main a[href*="#"]:not([href="#"])',context).click(function(e) {
          if (location.pathname.replace(/^\//,'') == this.pathname.replace(/^\//,'') && location.hostname == this.hostname) {
            var target = $(this.hash);
            target = target.length ? target : $('[name=' + this.hash.slice(1) +']');
            if (target.length) {
              $('html, body').animate({
                scrollTop: target.offset().top -80
              }, 1000);
              //Use this rather than return false
              e.preventDefault();
            }
          }
        });
      });
    }
  }
};


/*
* Sticky Header
* - On scroll to certain length header beomes sticky
*/
Drupal.behaviors.stickyHeader = {
  attach: function (context, settings) {


    supaScroll = function(){
      if ($(window).scrollTop() >= 50) {
        $('.header').addClass('sticky');
      } else {
        $('.header').removeClass('sticky');
      }
    }

    $(window).scroll(function(){
      supaScroll();
    });

  }
};

/**
* - On Scroll, remove the opened menu item
*/
Drupal.behaviors.scrollCloseElements = {
  attach: function(context, settings) {

    checkOrientationMenu = function() {
      $('#block-beaker-main-menu').removeClass('expanded');
      $('#menu-toggle').removeClass('expanded');
    };

    $(window).scroll(function() {
      checkOrientationMenu();
    });
  }
};


})(jQuery);
