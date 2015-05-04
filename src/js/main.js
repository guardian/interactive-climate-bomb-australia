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
        currentAnchors = {},
        lastAnchors = {},
        currentChapter,
        mobile = false,
        tablet = false,
        mute = false,
        ticking = false,
        latestKnownScrollY = 0,
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
                    "poster": "@@assetPath@@/videos/posters/poster.png",
                    "low": "",
                    "medium": "",
                    "high": "@@assetPath@@/videos/test6.mp4",
            },
            "loop": {
                    "poster": "@@assetPath@@/videos/posters/poster.png",
                    "low": "",
                    "medium": "",
                    "high": "@@assetPath@@/videos/loop.mp4",
            },
            "chapter1-1": {
                "poster": "@@assetPath@@/videos/chapter-1/thumbnails/Sect1Sq1.webmsd.png",
                "webm": "@@assetPath@@/videos/chapter-1/Sect1Sq1.webmhd.webm",
                "mp4": "",
            },
            "chapter1-2": {
                "poster": "@@assetPath@@/videos/chapter-1/thumbnails/Sect1Sq2.webmsd.png",
                "webm": "@@assetPath@@/videos/chapter-1/Sect1Sq2.webmhd.webm",
                "mp4": "",
            },
            "chapter1-3": {
                "poster": "@@assetPath@@/videos/chapter-1/thumbnails/Sect1Sq3.webmsd.png",
                "webm": "@@assetPath@@/videos/chapter-1/Sect1Sq3.webmhd.webm",
                "mp4": "",
            },
            "chapter1-4": {
                "poster": "@@assetPath@@/videos/chapter-1/thumbnails/Sect1Sq4.webmsd.png",
                "webm": "@@assetPath@@/videos/chapter-1/Sect1Sq4.webmhd.webm",
                "mp4": "",
            },
            "chapter1-5": {
                "poster": "@@assetPath@@/videos/chapter-1/thumbnails/Sect1Sq5.webmsd.png",
                "webm": "@@assetPath@@/videos/chapter-1/Sect1Sq5.webmhd.webm",
                "mp4": "",
            },
            "chapter1-6": {
                "poster": "@@assetPath@@/videos/chapter-1/thumbnails/Sect1Sq6.webmsd.png",
                "webm": "@@assetPath@@/videos/chapter-1/Sect1Sq6.webmhd.webm",
                "mp4": "",
            },
            "chapter1-7": {
                "poster": "@@assetPath@@/videos/chapter-1/thumbnails/Sect1Sq7.webmsd.png",
                "webm": "@@assetPath@@/videos/chapter-1/Sect1Sq7.webmhd.webm",
                "mp4": "",
            },
            "chapter2-1": {
                "poster": "",
                "webm": "@@assetPath@@/videos/chapter-2/Sect2Sq1.webmhd.webm",
                "mp4": "",
            },
            "chapter2-2": {
                "poster": "",
                "webm": "@@assetPath@@/videos/chapter-2/Sect2Sq2.webmhd.webm",
                "mp4": "",
            },
            "chapter2-3": {
                "poster": "",
                "webm": "@@assetPath@@/videos/chapter-2/Sect2Sq3.webmhd.webm",
                "mp4": "",
            },
            "chapter2-4": {
                "poster": "",
                "webm": "@@assetPath@@/videos/chapter-2/Sect2Sq4.webmhd.webm",
                "mp4": "",
            },
            "chapter2-5": {
                "poster": "",
                "webm": "@@assetPath@@/videos/chapter-2/Sect2Sq5.webmhd.webm",
                "mp4": "",
            },
            "chapter3-1": {
                "poster": "",
                "webm": "@@assetPath@@/videos/chapter-3/Sect3Sq1.webmhd.webm",
                "mp4": "",
            },
            "chapter3-2": {
                "poster": "",
                "webm": "@@assetPath@@/videos/chapter-3/Sect3Sq2.webmhd.webm",
                "mp4": "",
            },
            "chapter3-3": {
                "poster": "",
                "webm": "@@assetPath@@/videos/chapter-3/Sect3Sq3.webmhd.webm",
                "mp4": "",
            },
            "chapter3-4": {
                "poster": "",
                "webm": "@@assetPath@@/videos/chapter-3/Sect3Sq4.webmhd.webm",
                "mp4": "",
            },
            "chapter3-5": {
                "poster": "",
                "webm": "@@assetPath@@/videos/chapter-3/Sect3Sq5.webmhd.webm",
                "mp4": "",
            },
            "chapter3-6": {
                "poster": "",
                "webm": "@@assetPath@@/videos/chapter-3/Sect3Sq6.webmhd.webm",
                "mp4": "",
            },
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
            mainHTML = mainTemplate({getVideo: getVideo}),
            navTemplate = _.template(navTmpl),
            navHTML = navTemplate({});
            
        $body = $("body");
        $("html").css("overflow-y", "scroll");
        
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

        dom.anchors = {"chapter-1": {}, "chapter-2": {}, "chapter-3": {}};

        $("#chapter-1 a[name]").each(function(i, el) {
            var $el = $(el);
            dom.anchors['chapter-1'][$el.attr("name")] = $el;
        });

        $("#chapter-2 a[name]").each(function(i, el) {
            var $el = $(el);
            dom.anchors['chapter-2'][$el.attr("name")] = $el;
        });

        $("#chapter-3 a[name]").each(function(i, el) {
            var $el = $(el);
            dom.anchors['chapter-3'][$el.attr("name")] = $el;
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

        dom.text = {};
        $(".text--content").each(function(i, el) {
            var $el = $(el);
            dom.text[$el.closest(".int-main").attr("id")] = $el;
        });

        dom.audio = {};
        $(".audio-player").each(function(i, el) {
            var $el = $(el);
            dom.audio["chapter-" + $el.attr("id").slice(-1)] = $el;
        });

        dom.navigation = {};
        dom.navigation['container'] = $(".nav");

        rightTop = parseInt($("#css-rc").css("top"));
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

        // if(!mobile) {
        //     $(window).scroll(_.throttle(function() {
        //         // $(".chapter-intro").toggleClass("chapter-intro-animate");
        //         stickDivs();
        //         videoControl();
        //         // showNav();
        //         anchorsAction();
        //     }, 20));
        // } 

        $(window).scroll(function() {
            latestKnownScrollY = window.scrollY;
            requestTick();
        });

        $(window).scroll(_.debounce(function() {
            var currentScrollY = latestKnownScrollY;
            anchorsAction(currentScrollY);
        }, 100));

        // $(window).scroll(_.throttle(function() {
        //     navStuff();
        // }, 15));

        if((mobile || tablet) || $window.width() < 1040) {
            anchorReplace();
        }

        if(mobile) {
            breaksReplace();
        }

        dom.videos.chapters['chapter-1'].get(0).addEventListener('loadeddata', function() {
            resizeVideos();
        }, false);

        $(window).resize(_.throttle(function() {
                resizeVideos();
                saveSelectors();
        }, 100));
        
        // dom.videos.chapters['chapter-1'].get(0).addEventListener('ended', function(evt) { closeIntro(); }, false); 

        // $(".intro .close").on("click", function() {
        //     closeIntro();
        //     $(".title-box").addClass("s-1");

        //     setTimeout(function() {
        //         $(".title-box").addClass("s-2");

        //         setTimeout(function() {
        //             $(".title-box").addClass("s-3");
        //         }, 600);
        //     }, 300);
        // });

        $(".js-mute").on("click", function() {
            muteVideo();
        });
        // initTicker();
    }

    function requestTick() {
        if(!ticking) {
            requestAnimationFrame(_.throttle(update, 20));
        }
        ticking = true;
    }

    function update() {
        // reset the tick so we can
        // capture the next onScroll
        ticking = false;

        var currentScrollY = latestKnownScrollY;

        // read offset of DOM elements
        // and compare to the currentScrollY value
        // then apply some CSS classes
        // to the visible items

        stickDivs(currentScrollY);
        navStuff(currentScrollY);
        videoControl(currentScrollY);
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

    function stickDivs(scrollY) {
        _.each(dom.chapters, function(val, key) {
            var $div = val;

            if(key !== "intro") {
                if($div.offset().top + $div.height() - stickyTop <= scrollY + $div.children(".right-container").height()) {
                    $div.children(".right-container").addClass("right-container--bottom");
                } else {
                    $div.children(".right-container").removeClass("right-container--bottom");
                }

                if($div.offset().top - (stickyTop - rightTop) <= scrollY) {
                    $div.children(".right-container").addClass("right-container--sticky");
                } else {
                    $div.children(".right-container").removeClass("right-container--sticky");
                }
            }

            if($div.offset().top - 500 <= scrollY && ($div.offset().top + $div.height()) - 500 >= scrollY) {
                $div.children(".right-container").addClass("visible");
            } else {
                $div.children(".right-container").removeClass("visible");
            }
        
        });
    }

    function videoControl(scrollY) {
        _.each(dom.videos.breaks, function(val, key) {
            var $el = val;

            if($el.parent().offset().top - $window.height() + 250 <= scrollY && $window.scrollTop() + 250 < $el.parent().offset().top + $el.parent().height()) {
                // $el.parent().css("opacity", "1");
                $el.get(0).volume = 1;

                setTimeout(function() {
                    $el.get(0).play();
                }, 300);
            } else {
                // $el.parent().css("opacity", "0");
                $el.get(0).volume = 0;
                $el.get(0).pause();
            }

            if($el.parent().offset().top <= $window.scrollTop()) {
                $el.css("position", "fixed");
            } else {
                $el.css("position", "absolute");
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
        // if(dom.videos.breaks[Object.keys(dom.videos.breaks)[0]].width() / dom.videos.breaks[Object.keys(dom.videos.breaks)[0]].height() < $body.width() / $body.height()) {
            $body.removeClass("non-wide");

            _.each(dom.videos.breaks, function($el, key) {
                $el.css("margin-left", 0);
            });

            // videos
            // _.each(dom.videos.chapters, function($el, key) {
            //     $el.css("margin-left", (-($el.width() - $el.parent(".right-container").width())/2));
            // });

            $("head").append("<style type='text/css'>.right-container video { margin-left: " + (-(dom.videos.chapters['chapter-1'].width() - dom.videos.chapters['chapter-1'].parent(".right-container").width())/2) + "px;}</style>");

            dom.videos.intro.css("margin-left", 0);
        // } else {
        //     $body.addClass("non-wide");

        //     _.each(dom.videos.breaks, function($el, key) {
        //         $el.css("margin-left", (-($el.width() - $body.width())/2));
        //     });

        //     _.each(dom.videos.chapters, function($el, key) {
        //         $el.css("margin-left", (-($el.width() - $el.parent(".right-container").width())/2));
        //     });

        //     dom.videos.intro.css("margin-left", (-(dom.videos.intro.width() - $body.width())/2));
        // }
    }

    function navStuff(scrollY) {
        var section = "";
        _.each(dom.breaks, function($el, key) {
            if($el.offset().top <= scrollY) {
                if(key !== currentChapter) {
                    section = key;
                    currentChapter = key;
                }
            }

            if(key === "full-intro" && ($el.offset().top + $el.height() <= scrollY)) {
                dom.navigation.container.addClass("nav--show");

                $("#p-1").addClass("p-visible");

                setTimeout(function() {
                    $("#p-2").addClass("p-visible");
                }, 1000);

                setTimeout(function() {
                    $("#p-3").addClass("p-visible");
                }, 2000);

                setTimeout(function() {
                    $("#p-4").addClass("p-visible");
                }, 3000);

            } else if(key === "full-intro") {
                dom.navigation.container.removeClass("nav--show");
            }
        });

        if(section) {
            $(".nav-chapter--selected").removeClass("nav-chapter--selected");
            $("#nav-chapter-" + section.slice(-1)).addClass("nav-chapter--selected");

            _.each(dom.audio, function($el, key) {
                $el.get(0).pause();
            });

            dom.audio["chapter-" + section.slice(-1)].get(0).play();
        }

        dom.navigation.container.find(".change").html(section);
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

    // function anchorsAction() { 
    //     _.each(dom.anchors, function(val, key) {
    //         var $el = val;

    //         if($.inArray($el.attr("name"), anchorsFired) < 0 && $el.offset().top - 200 < $window.scrollTop()) {
    //             var parent = $el.closest(".main").attr("id");

    //             if($el.data("type") === "video") {
    //                 changeVideo($el);
    //             } 

    //             if($el.data("type") === "image") {
    //                 changeImage($el);
    //             }

    //             anchorsFired[anchorsFired.length] = $el.attr("name");
    //         }
    //     });
    // }

    function anchorsAction(scrollY) { 
        _.each(dom.chapters, function(el, chapterName) {
            lastAnchors[chapterName] = "";

            _.each(dom.anchors[chapterName], function(val, key) {
                var $el = val;
                if($el.offset().top - 200 < scrollY) {
                    lastAnchors[chapterName] = $el;
                }
            });
            if(lastAnchors[chapterName] !== "" && currentAnchors[chapterName] !== lastAnchors[chapterName]) {
                dom.text[chapterName].removeClass("first");

                if(lastAnchors[chapterName].data("type") === "video") {
                    changeVideo(lastAnchors[chapterName]);
                } 

                if(lastAnchors[chapterName].data("type") === "image") {
                    changeImage(lastAnchors[chapterName]);
                }

                currentAnchors[chapterName] = lastAnchors[chapterName];

            } else if(lastAnchors[chapterName] === "" && !dom.text[chapterName].hasClass("first")) {
                delete currentAnchors[chapterName];
                dom.text[chapterName].addClass("first");
                changeVideo(dom.text[chapterName]);
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

        _.each(videos, function(val, key) {
            var poster = new Image(1,1);
            poster.src = val.poster;
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

    // function changeVideo($anchor) {
    //     var $chapter = $anchor.closest(".chapter");

    //     $chapter.find(".right-container").append(getVideo($anchor.attr("name"), "waiting"));

    //     var $video = $chapter.find("video.waiting").last();

    //     dom.videos.chapters[$chapter.attr("id")] = $video;

    //     $video.one('play', function() {
    //         $chapter.find(".waiting").removeClass("waiting").addClass("top-layer");
    //         $chapter.find(".top-layer").first().animate({volume: 0}, 1000);
    //         setTimeout(function() {
    //             $chapter.find(".top-layer").first().remove();
    //         }, 1000);
    //     });
    // }

    function changeVideo($anchor) {
        var $chapter = $anchor.closest(".chapter");

        $chapter.find(".right-container").prepend(getVideo($anchor.attr("name"), "waiting"));

        var $video = $chapter.find("video.waiting").first();

        dom.videos.chapters[$chapter.attr("id")] = $video;

        $video.parent().css("background-image", "url('" + videos[$anchor.attr("name")].poster + "')");

        $chapter.find(".waiting").removeClass("waiting").addClass("top-layer");
        $chapter.find(".top-layer").slice(1).fadeOut(300, function() { $(this).remove(); });

    }

    // function changeVideo($anchor) {
    //     var $chapter = $anchor.closest(".chapter");
    //     var mutedTag = (mute) ? "muted" : "";

    //     $chapter.find(".right-container").append("<video class='waiting' preload='auto' autoplay " + mutedTag + " poster='" + getVideo($anchor.attr("name")).poster + "'></video>");
    //     $chapter.find("video.waiting").attr('src', getVideo($anchor.attr("name")).video);

    //     var $video = $chapter.find("video.waiting").last();
    //     dom.videos.chapters[$chapter.attr("id")] = $video;

    //     setTimeout(function() {
    //         $chapter.find(".waiting").removeClass("waiting").addClass("top-layer");

    //         setTimeout(function() {
    //             $chapter.find(".top-layer").first().remove();
    //         }, 300);
    //     }, 10);
    // }

    // function showNav() {
    //     var showNav = false;

    //     _.each(dom.chapters, function(val, key) {
    //         var $el = val;

    //         if(showNav != true && $window.scrollTop() >= $el.offset().top && $window.scrollTop() <= $el.offset().top + $el.height() - $window.height()) {
    //             showNav = $el.attr("id");
    //         }
    //     });

    //     if(showNav !== false) {
    //         _.each(dom.nav.items, function($el, key) {
    //             $el.removeClass("previous").removeClass("selected-chapter");
    //             if($el.data("nav") <= parseInt(showNav.slice(-1))) {
    //                 $el.addClass("previous");
    //             }
    //         });

    //         dom.nav.items["nav-" + showNav].addClass("selected-chapter");
    //         dom.nav.container.removeClass("nav-hidden");
    //     } else {
    //         dom.nav.container.addClass("nav-hidden");
    //         setTimeout(function() {
    //             if(dom.nav.container.hasClass("nav-hidden")) {
    //                 _.each(dom.nav.items, function($el, key) {
    //                     $el.removeClass("previous").removeClass("selected-chapter");
    //                 });
    //             }
    //         }, 300);
    //     }
    // }

    function getImage(name) {
        var src = images[name].high;

        return src;
    }

    function getAltImage(name) {
        var src = altImages[name].high;

        return src;
    }

    function getVideo(name, className) {
        var mutedTag = (mute) ? "muted" : "",
            classTag =  (className) ? " class='" + className + "' " : "",
            src = {};
        src.mp4 = (videos[name].mp4) ? "<source src='" + videos[name].mp4 + "' type='video/mp4'>" : "";
        src.webm = (videos[name].webm) ? "<source src='" + videos[name].webm + "' type='video/webm'>" : "";

        return "<video " + classTag + " preload='none' " + mutedTag + " loop>" + src.mp4 + src.webm + "</video>";
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
