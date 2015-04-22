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
        $body,
        anchorsFired = new Array(),
        mobile = false,
        tablet = false,
        mute = false,
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
                    "poster": "@@assetPath@@/imgs/poster.png",
                    "low": "",
                    "medium": "",
                    "high": "@@assetPath@@/imgs/test6.mp4",
                }
            },
        altImages = {
            "bob": {
                    "low": "",
                    "medium": "",
                    "high": "http://upload.wikimedia.org/wikipedia/commons/0/0b/Miner_in_a_gallery_Potosi_(pixinn.net).jpg",
                },
            "second": {
                    "low": "",
                    "medium": "",
                    "high": "http://www.mapsofworld.com/australia/australia-map.gif",
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
            
        $body = $("body");

        $("html").css("overflow-y", "scroll");

        $body.addClass("intro-visible");

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

        dom.videos.intro = $(".intro video");

        dom.anchors = {};
        $("a[name]").each(function(i, el) {
            var $el = $(el);
            dom.anchors[$el.attr("name")] = $el;
        });

        dom.nav = {"items": {}};
        dom.nav['container'] = $(".nav");
        $(".js-nav-item").each(function(i, el) {
            var $el = $(el);
            dom.nav.items[$el.attr("id")] = $el;
        });

        dom.breaks = {};
        $(".full").each(function(i, el) {
            var $el = $(el);
            dom.breaks[$el.attr("id")] = $el;
        });

        dom.mobileNav = {};
        dom.mobileNav['container'] = $(".mobile-nav");

        rightTop = parseInt($(".right-container").not(".right-container--sticky").first().css("top"))
        stickyTop = parseInt($("#css").css("top"), 10);

        console.log(dom);
    }

    function whatBrowser() {
        if(bowser.mobile) {
            mobile = true;
        }

        if(bowser.tablet) {
            tablet = true;
        }
    }

    function initEvents() {
        preLoad();

        if(!mobile) {
            $(window).scroll(_.throttle(function() {
                stickDivs();
                videoControl();
                showNav();
                anchorsAction();
            }, 15));
        } 

        $(window).scroll(_.throttle(function() {
            mobileNav();
        }, 250));

        if((mobile || tablet) || $window.width() < 1040) {
            anchorReplace();
        }

        if(mobile) {
            breaksReplace();
        }

        dom.videos.intro.get(0).addEventListener('loadeddata', function() {
            resizeVideos();
        }, false);

        $(window).resize(_.throttle(function() {
                resizeVideos();
                saveSelectors();
        }, 100));
        
        dom.videos.intro.get(0).addEventListener('ended', function(evt) { closeIntro(); }, false); 

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

        $(".js-mute").on("click", function() {
            muteVideo();
        });
        // initTicker();
    }

    function anchorReplace() {
        _.each(dom.anchors, function(val, key) {
            var $el = val;

            $el.after("<div class='mobile-alt' style='background-image: url(\"" + getAltImage($el.data('mobile-alt')) + "\");'></img>");
            $el.remove();
        });
    }

    function breaksReplace() {
        _.each(dom.breaks, function($el, key) {
            $el.find("video").remove();
            $el.css("background-image", "url('" + getAltImage($el.data('mobile-alt')) + "')");
        });
        dom.videos.intro.parent().css("background-image", "url('" + getAltImage(dom.videos.intro.parent().data('mobile-alt')) + "')");
        dom.videos.intro.remove();

    }

    function stickDivs() {
        _.each(dom.chapters, function(val, key) {
            var $div = val;

            if($div.offset().top + $div.height() - stickyTop <= $window.scrollTop() + $div.children(".right-container").height()) {
                $div.children(".right-container").addClass("right-container--bottom");
            } else {
                $div.children(".right-container").removeClass("right-container--bottom");
            }

            if($div.offset().top - (stickyTop - rightTop) <= $window.scrollTop()) {
                $div.children(".right-container").addClass("right-container--sticky");
            } else {
                $div.children(".right-container").removeClass("right-container--sticky");
            }
        });
    }

    function videoControl() {
        _.each(dom.videos.breaks, function(val, key) {
            var $el = val;

            if($el.parent().offset().top - $window.height() + 250 <= $window.scrollTop() && $window.scrollTop() + 250 < $el.parent().offset().top + $el.parent().height()) {
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

            if($el.parent().offset().top <= $window.scrollTop() + $window.height()) {
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

    function muteVideo() {
        mute = (mute) ? false : true;
        _.each(dom.videos.breaks, function($el, key) {
            $el.get(0).muted = mute;
        });
        _.each(dom.videos.chapters, function($el, key) {
            $el.get(0).muted = mute;
        });

        if(dom.videos.intro.get(0)) {
            dom.videos.intro.get(0).muted = mute;
        }

        if(mute === true) {
            $(".js-mute-text").html("Unmute");
            $(".mute").addClass("muted");
        } else {
            $(".js-mute-text").html("Mute");
            $(".mute").removeClass("muted");
        }
    }

    function resizeVideos() {
        if(dom.videos.breaks[Object.keys(dom.videos.breaks)[0]].width() / dom.videos.breaks[Object.keys(dom.videos.breaks)[0]].height() < $body.width() / $body.height()) {
            $body.addClass("wide");

            _.each(dom.videos.breaks, function($el, key) {
                $el.css("margin-left", 0);
            });

            _.each(dom.videos.chapters, function($el, key) {
                $el.css("margin-left", 0);
            });

            dom.videos.intro.css("margin-left", 0);
        } else {
            $body.removeClass("wide");

            _.each(dom.videos.breaks, function($el, key) {
                $el.css("margin-left", (-($el.width() - $body.width())/2));
            });

            _.each(dom.videos.chapters, function($el, key) {
                $el.css("margin-left", (-($el.width() - $el.parent(".right-container").width())/2));
            });

            dom.videos.intro.css("margin-left", (-(dom.videos.intro.width() - $body.width())/2));
        }
    }

    function mobileNav() {
        var section = "";
        _.each(dom.breaks, function($el, key) {
            if($el.offset().top <= $window.scrollTop()) {
                section = $el.data("nav-name");
            }

            if(key === "head-1" && ($el.offset().top + $el.height() - 250 <= $window.scrollTop())) {
                dom.mobileNav.container.addClass("mobile-nav--show");
            } else if(key === "head-1") {
                dom.mobileNav.container.removeClass("mobile-nav--show");
            }
        });
        dom.mobileNav.container.find(".change").html(section);
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

        if(mobile || tablet) {
            _.each(altImages, function(val, key) {
                var key = new Image(1,1);
                key.onload = function() {
                }
                key.src = val.high;
            });
        }
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
        var mutedTag = (mute) ? "muted" : "";

        $chapter.find(".right-container").append("<video class='waiting' preload='auto' autoplay " + mutedTag + " poster='" + getVideo($anchor.attr("name")).poster + "'></video>");
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

            if(showNav != true && $window.scrollTop() >= $el.offset().top && $window.scrollTop() <= $el.offset().top + $el.height() - $window.height()) {
                showNav = $el.attr("id");
            }
        });

        if(showNav !== false) {
            _.each(dom.nav.items, function($el, key) {
                $el.removeClass("previous").removeClass("selected-chapter");
                if($el.data("nav") <= parseInt(showNav.slice(-1))) {
                    $el.addClass("previous");
                }
            });

            dom.nav.items["nav-" + showNav].addClass("selected-chapter");
            dom.nav.container.removeClass("nav-hidden");
        } else {
            dom.nav.container.addClass("nav-hidden");
            setTimeout(function() {
                if(dom.nav.container.hasClass("nav-hidden")) {
                    _.each(dom.nav.items, function($el, key) {
                        $el.removeClass("previous").removeClass("selected-chapter");
                    });
                }
            }, 300);
        }
    }

    function getImage(name) {
        var src = images[name].high;

        return src;
    }

    function getAltImage(name) {
        var src = altImages[name].high;

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
