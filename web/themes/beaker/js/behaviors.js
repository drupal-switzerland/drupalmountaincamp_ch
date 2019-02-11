(function($) {
  Drupal.behaviors.menuToggle = {
    attach: function(context, settings) {
      function setLabels($element, label) {
        $element
          .attr('aria-label', label)
          .find('.visually-hidden')
          .text(label);
      }

      var openText = Drupal.t('Open menu');
      var closeText = Drupal.t('Close menu');

      $('.menu-toggle__button').on('click', function() {
        $('.menu-toggle__icon')
          .toggleClass('expanded')
          .parents('header')
          .toggleClass('expanded');

        if ($('.menu-toggle__icon').hasClass('expanded')) {
          setLabels($(this), closeText);
          $('.main-menu-wrapper .menu a')
            .first()
            .focus();
        } else {
          setLabels($(this), openText);
        }
      });
    },
  };

  /*
   * Slow scroll to Anchor
   * - https://css-tricks.com/snippets/jquery/smooth-scrolling/
   */
  Drupal.behaviors.accordionActiveTrail = {
    attach: function(context, settings) {
      if ($('.path-frontpage')) {
        $(function() {
          $('.menu--main a[href*="#"]:not([href="#"])', context).click(function(e) {
            if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
              var target = $(this.hash);
              target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
              if (target.length) {
                $('html, body')
                  .animate({scrollTop: target.offset().top - 80}, 1000);
                //Use this rather than return false
                e.preventDefault();
              }
            }
          });
        });
      }
    },
  };

  Drupal.behaviors.campSessions = {
    attach: function(context, settings) {
      var $context = $(context);

      $context.find('.session--keynote').removeClass('session--keynote').parent().parent().parent().parent().parent().addClass('session--keynote');
      $context.find('.session--break').removeClass('session--break').parent().parent().parent().parent().parent().addClass('session--break');
      $context.find('.session--closing-session').removeClass('session--closing-session').parent().parent().parent().parent().parent().addClass('session--closing-session');
      $context.find('.session--social-activity').removeClass('session--social-activity').parent().parent().parent().parent().parent().addClass('session--social-activity');
    },
  };
})(jQuery);
