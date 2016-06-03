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

  // This is just a template
  // Drupal.behaviors.somecustomModule = {
  //   attach: function(context, settings) {

  //   }
  // };

})(jQuery);
