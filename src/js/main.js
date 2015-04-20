define([
    'jquery',
    'underscore',
    'bowser',
    'text!templates/mainTemplate.html',
    'text!templates/navTemplate.html'
], function(
    $,
    _,
    bowser,
    mainTmpl,
    navTmpl
) {
   'use strict';

    var rightTop,
        stickyTop,
        $window = $(window),
        anchorsFired = new Array(),
        mobile = false,
        images = {
            "bob": {
                    "low": "",
                    "medium": "",
                    "high": "http://upload.wikimedia.org/wikipedia/commons/0/0b/Miner_in_a_gallery_Potosi_(pixinn.net).jpg",
                },
            "second": {
                    "low": "",
                    "medium": "",
                    "high": "http://www.mapsofworld.com/australia/australia-map.gif",
                }, 
            "testLarge": {
                    "low": "",
                    "medium": "",
                    "high": "http://breakingenergy.com/wp-content/uploads/sites/2/2013/06/coal-australia.jpg"
                }
            },
        videos = {
            "video": {
                    "poster": "@@assetPath@@/imgs/organ-mountains-mod.jpg",
                    "low": "",
                    "medium": "",
                    "high": "@@assetPath@@/imgs/test.mp4",
                }
            },
        dom = {};

    function init(el, context, config, mediator) {
        whatBrowser();
        app();
    }

    function app() {
        var mainTemplate = _.template(mainTmpl),
            mainHTML = mainTemplate({}),
            navTemplate = _.template(navTmpl),
            navHTML = navTemplate({});

        $("html").css("overflow-y", "scroll");

        $('body').addClass("intro-visible");

        $(".element-interactive").append(mainHTML)
        $(".element-interactive .story-wrapper").before(navHTML);
        saveSelectors();
        initEvents();
    }

    function saveSelectors() {
        dom.chapters = {};
        $(".chapter").each(function(i, el) {
            var $el = $(el);
            dom.chapters[$el.attr("id")] = $(el);
        });

        dom.videos = {"chapters": {}, "breaks": {}};
        $(".right-container video").each(function(i, el) {
            var $el = $(el);
            dom.videos.chapters[$el.closest(".chapter").attr("id")] = $el;
        });

        $(".full video").each(function(i, el) {
            var $el = $(el);
            dom.videos.breaks[$el.parent(".full").attr("id")] = $el;
        });

        dom.anchors = {};
        $("a[name]").each(function(i, el) {
            var $el = $(el);
            dom.anchors[$el.attr("name")] = $el;
        });

        dom.nav = {"items": {}}
        dom.nav['container'] = $(".nav");
        $(".nav-item").each(function(i, el) {
            var $el = $(el);
            dom.nav.items[$el.attr("id")] = $el;
        });
        console.log(dom);
    }

    function whatBrowser() {
        if(bowser.mobile) {
            mobile = true;
        }
    }

    function initEvents() {
        rightTop = $("#chapter-1").children(".right-container").offset().top - $("#chapter-1").offset().top;
        stickyTop = parseInt($("#css").css("top"), 10);

        preLoad();

        if(!mobile) {
            $(window).scroll(_.throttle(function() {
                stickDivs();
                videoControl();
                showNav();
                anchorsAction();
            }, 25));
        } else {
            anchorReplace();
        }
        
        $(".intro video").get(0).addEventListener('ended', function(evt) { closeIntro(); }, false); 

        $(".intro .close").on("click", function() {
            closeIntro();
            $(".title-box").addClass("s-1");

            setTimeout(function() {
                $(".title-box").addClass("s-2");

                setTimeout(function() {
                    $(".title-box").addClass("s-3");
                }, 600);
            }, 300);
        });

        // initTicker();
    }

    function anchorReplace() {
        _.each(dom.anchors, function(val, key) {
            console.log(key);
            var $el = val;

            $el.after("<div class='mobile-alt' style='background-image: url(\"" + getImage($el.data('mobile-alt')) + "\");'></img>");
            $el.remove();
        });
    }

    function stickDivs() {
        _.each(dom.chapters, function(val, key) {
            var $div = val;

            if($div.offset().top + $div.height() - stickyTop < $window.scrollTop() + $div.children(".right-container").height()) {
                $div.children(".right-container").addClass("right-container--bottom");
            } else {
                $div.children(".right-container").removeClass("right-container--bottom");
            }

            if($div.offset().top - (stickyTop - rightTop) < $window.scrollTop()) {
                $div.children(".right-container").addClass("right-container--sticky");
            } else {
                $div.children(".right-container").removeClass("right-container--sticky");
            }
        });
    }

    function videoControl() {
        _.each(dom.videos.breaks, function(val, key) {
            var $el = val;

            if($el.offset().top - $window.height() + 250 <= $window.scrollTop() && $window.scrollTop() + 250 < $el.parent().offset().top + $el.parent().height()) {
                $el.parent().css("opacity", "1");
                $el.get(0).volume = 1;
                setTimeout(function() {
                    $el.get(0).play();
                }, 300);
            } else {
                $el.parent().css("opacity", "0");
                $el.get(0).volume = 0;
                setTimeout(function() {
                    $el.get(0).pause();
                }, 300);
            }

            if($el.parent().offset().top <= $window.scrollTop()) {
                $el.css("position", "fixed");
            } else {
                $el.css("position", "relative");
            }
        });

        _.each(dom.videos.chapters, function(val, key) {
            var $el = val;

            if($el.parent().hasClass("right-container--sticky") && !$el.parent().hasClass("right-container--bottom")) {
                $el.get(0).play();
            } else {
                $el.get(0).pause();
            }
        }, {});
    }

    function closeIntro() {
        $("body").removeClass("intro-visible");
        if(!mobile) {
            dom.videos.breaks['head-1'].get(0).play();
        }

        setTimeout(function() {
                $(".intro").remove();
        }, 300);
    }

    // function initTicker() {
    //     incrementTicker();
    // }

    // function incrementTicker() {
    //     coalTicker = coalPerSecond*1.205*price*(new Date() - timeLoaded)/1000;

    //     $(".ticker").html("<p>You have been on this article for " + seconds2time(Math.round(((new Date() - timeLoaded)/1000))) + ".</p><p>In this time, $" + coalTicker.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "<br>of coal has been extracted worldwide.</p>");

    //     setTimeout(function() {
    //         incrementTicker();
    //     },250);
    // }

    function anchorsAction() { 
        _.each(dom.anchors, function(val, key) {
            var $el = val;

            if($.inArray($el.attr("name"), anchorsFired) < 0 && $el.offset().top - 200 < $window.scrollTop()) {
                var parent = $el.closest(".main").attr("id");

                if($el.data("type") === "video") {
                    changeVideo($el);
                } 

                if($el.data("type") === "image") {
                    changeImage($el);
                }

                anchorsFired[anchorsFired.length] = $el.attr("name");
            }
        });
    }

    function preLoad() {
        var imagesLoaded = 0;
        _.each(images, function(val, key) {
            var key = new Image(1,1);
            key.onload = function() {
                imagesLoaded++;
                if(imagesLoaded === _.keys(images).length) {
                    onLoaded();
                }
            }
            key.src = val.high;
        });
    }

    function onLoaded() {
        $(".close").css("opacity", "1");
    }

    function changeImage($anchor) {
        var $chapter = $anchor.closest(".chapter");

        $chapter.find(".right-container").append("<img class='waiting'/>");
        $chapter.find("img.waiting").attr('src', getImage($anchor.attr("name")));

        setTimeout(function() {
           $chapter.find("img.waiting").removeClass("waiting").addClass("top-layer"); 

           setTimeout(function() {
                $chapter.find(".top-layer").first().remove();
            }, 300);
        }, 10);    
    }

    function changeVideo($anchor) {
        var $chapter = $anchor.closest(".chapter");

        $chapter.find(".right-container").append("<video class='waiting' preload='auto' autoplay muted poster='" + getVideo($anchor.attr("name")).poster + "'></video>");
        $chapter.find("video.waiting").attr('src', getVideo($anchor.attr("name")).video);

        var $video = $chapter.find("video.waiting");
        dom.videos.chapters[$chapter.attr("id")] = $video;

        setTimeout(function() {
            $chapter.find(".waiting").removeClass("waiting").addClass("top-layer");

            setTimeout(function() {
                $chapter.find(".top-layer").first().remove();
            }, 300);
        }, 10);
    }

    function showNav() {
        var showNav = false;

        _.each(dom.chapters, function(val, key) {
            var $el = val;

            if(showNav != true && $window.scrollTop() > $el.offset().top && $window.scrollTop() < $el.offset().top + $el.height() - $window.height()) {
                showNav = $el.attr("id");
            }
        });

        if(showNav !== false) {
            dom.nav.container.removeClass("nav-hidden");

            _.each(dom.nav.items, function(val, key) {
                val.removeClass("selected-chapter");
            });

            dom.nav.items["nav-" + showNav].addClass("selected-chapter");

        } else {
            dom.nav.container.addClass("nav-hidden");
        }
    }

    function getImage(name) {
        var src = images[name].high;

        return src;
    }

    function getVideo(name) {
        var src = {};
        src.video = videos[name].high;
        src.poster = videos[name].poster;

        return src;
    }

    function seconds2time(seconds) {
        var hours   = Math.floor(seconds / 3600);
        var minutes = Math.floor((seconds - (hours * 3600)) / 60);
        var seconds = seconds - (hours * 3600) - (minutes * 60);
        var time = "";

        if (hours != 0) {
          time = hours+":";
        }
        if (minutes != 0 || time !== "") {
          minutes = (minutes < 10 && time !== "") ? "0"+minutes : String(minutes);
          time += minutes+":";
        }
        if (time === "") {
          time = seconds+"s";
        }
        else {
          time += (seconds < 10) ? "0"+seconds : String(seconds);
        }
        return time;
    }

    return {
        init: init
    };
});
