(function(ns){
  ns.Interface = function (node) {
    this.chrono = function () {
      var lastSeconds, lastMinutes;
      var $seconds = node.find(".chrono .seconds");
      var $minutes = node.find(".chrono .minutes");
      var interv;

      return {
        setTime: function (ms) {
          var seconds = Math.floor(ms / 1000) % 60;
          var minutes = Math.floor(ms / 60000) % 60;
          if (seconds != lastSeconds) {
            $seconds.text(seconds<=9 ? "0"+seconds : seconds);
            lastSeconds = seconds;
          }
          if (minutes != lastMinutes) {
            $minutes.text(minutes);
            lastMinutes = minutes;
          }
          return this;
        },
        bind: function (getTime, msRate) {
          var self = this;
          interv && clearInterval(interv);
          interv = setInterval(function () {
            self.setTime(getTime());
          }, msRate);
        },
        unbind: function () {
          interv && clearInterval(interv);
          interv = null;
        }
      }
    }

    this.message = function () {
      var $node = node.find(".front");
      var $title = $node.find(".title");
      var $message = $node.find(".message");

      function countdown (seconds, everysecond) {
        everysecond(seconds);
        var i = setInterval(function(){
          --seconds;
          if (seconds <= 0) clearInterval(i);
          everysecond(seconds);
        }, 1000);
        return i;
      }

      return {
        setMessage: function (message, value) {
          $title.text(message);
          $message.removeClass("change").text(value);
          return this;
        },
        transparent: function () {
          $node.attr("class", "front bgtransparent");
          return this;
        },
        darker: function () {
          $node.attr("class", "front bgdarker");
          return this;
        },
        show: function () {
          $node.fadeIn();
          return this;
        },
        hide: function () {
          $node.hide();
          return this;
        },
        animateValue: function () {
          $message.removeClass("change").clearQueue().delay(100).queue(function () {
            $message.addClass("change");
          });
          return this;
        },
        countdownStart: function (seconds, title, onEnd) {
          var self = this;
          $message.addClass("countdown");
          return countdown(seconds+1, function (remainingSeconds) {
            if (remainingSeconds <= 0) {
              $message.removeClass("countdown");
              self.hide();
            }
            else if (remainingSeconds == 1) {
              self.transparent().setMessage(title, "GO!").animateValue().show();
              onEnd && onEnd();
            }
            else {
              self.darker().setMessage(title, remainingSeconds-1).animateValue().show();
            }
          });
        }

      }
    }

  }
}(window.BlazingRace));
