/**
 * @fileoverview Preloading the queue
 * @author Mario Penterman
 * @version 20140610
 * @preserve Copyright 2014 UPX Systems
 *
 * Preloader
 * =========
 *
 * Example Preloader Usage:
 *  Backbone.Preloader.queue = {
 *    'key': 'promise',
 *  };
 *  Backbone.Preloader.on('start', function(){
 *    // do stuff
 *  });
 *  Backbone.Preloader.on('promise:loaded', function() {
 *    // do stuff
 *  });
 *  Backbone.Preloader.on('complete', function() {
 *    Backbone.history.start();
 *  });
 *  $(document).ready(function() {
 *    Preloader.start();
 *  });
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['underscore', "jquery", "backbone"], factory);
    }
}(this, function (_, jQuery, Backbone) {
    Backbone.Preloader = (function(Backbone, $, _){
        var Preloader = _.extend({
          /** Time in seconds until the Preloader gives up and triggers complete */
          timeout     : 10,
          /**
           * Backbone.Events overrides this and becomes a hook for capturing events.
           * Events List:
           * <ul>
           * <li>__variable__:loading - called when a promise started processing.</li>
           * <li>__variable__:loaded - called when a promise is resolved.</li>
           * <li>__variable__:error - called when a promise is rejected.</li>
           * <li>start - called when preloader started.</li>
           * <li>loaded - called when any promise is triggered</li>
           * <li>error - called when any promise in the queue was rejected</li>
           * <li>complete - called when the queue is processed</li>
           * <li>timeout - called when timeout is reached before complete</li>
           * </ul>
           */
          on          : undefined,
          /** Inherited from Backbone.Events */
          off         : undefined,
          /** Inherited from Backbone.Events */
          trigger     : undefined,
          /**
           * Start the preloading
           */
          start: function() {
            if (this.started) return;
            this.trigger('start');
            this.started      = true;
            this.loaded       = 0;
            this.loading      = 0;
            this.records      = {};
            for (var key in this.queue) {
              this.records[key] = {
                'deferred': this.queue[key],
                'status': false
              };
              this.loading += 1;
            }
            this.load_next();
            this.timer = setTimeout(function() {
              Preloader.timedout()
            }, this.timeout*1000);
          },
          /**
           * Start the preloading
           */
          load_next: function() {
            for (var key in this.records) {
              if (this.records[key].status===false) {
                this.records[key].typeOf = key;
                var self = this;

                $.when(this.records[key].deferred).then(
                    function(){
                        self.load_complete(key);
                    },
                    function(error){
                        self.error(key, error)
                    }
                );

                this.trigger(key+':loading');
                this.records[key].status = 'loading';
              }
            }
          },
          /**
           * When the deferred object is resolved, return back here to clean
           * up and fire other events.
           */
          load_complete: function(key) {
            this.records[key].status = true;
            this.loaded += 1;

            this.trigger('loaded', this.records, key);
            this.trigger(key+':loaded', this.records[key]);

            this.load_next();
            if (this.loaded>=this.loading)
              this.complete();
          },
          /**
           * When preloading is complete
           */
          complete: function() {
            this.trigger('complete');
            clearTimeout(this.timer);
            this.off('start');
            this.off('timeout');
            this.off('loaded');
            this.off('complete');
          },
          /**
           * Handles errors thrown from queues and calls other error triggers for the
           * user to intercept.
           */
          error: function(key, error) {
            this.records[key].status = true;
            this.loaded += 1;
            this.trigger('error', this.records, key, error);
            this.trigger(key+':error', this.records[key], error);
            if (this.loaded>=this.loading)
              this.complete();
          },
          /**
           * Called after X seconds defined by this.timeout. If this is called it means
           * that the preloader took too long to complete and the user should do
           * something about it so the user doesn't close the browser out of
           * frustration.
           */
          timedout: function() {
            if (this.loaded<this.loading)
              this.trigger('timeout');
            this.trigger('complete', false);
          }
        }, Backbone.Events);

        return Preloader;
    })(Backbone, jQuery, _);

    return Backbone.Preloader;
}));
