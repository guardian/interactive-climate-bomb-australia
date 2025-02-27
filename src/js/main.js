define([
    'jquery',
    'jQuery-ajaxTransport-XDomainRequest',
    'lodash',
    'bowser',
    'viewportSize',
    'text!templates/mainTemplate.html',
    'text!templates/navTemplate.html'
], function(
    $,
    jqueryAjaxPlugin,
    _,
    bowser,
    viewportSize,
    mainTmpl,
    navTmpl
) {
   'use strict';
    var rightTop,
        stickyTop,
        sheets,
        $window = $(window),
        $body,
        fixed = {},
        anchorsFired = new Array(),
        currentAnchors = {},
        lastAnchors = {},
        currentChapter,
        windowWidth = viewportSize.getWidth(),
        pastIntro = false,
        mobile = false,
        tablet = false,
        mute = false,
        currentAudio = "full-intro",
        ticking = false,
        latestKnownScrollY = 0,
        volumes = {
            "videos": 0.6,
            "audio": 0.5,
        },
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
        $.ajax({
            url: "http://interactive.guim.co.uk/spreadsheetdata/0AjKEhS-Bj-4DdHBhTW5Sc3lMdmZJX1JJZS11OU1HQ1E.json",
            cache: false,
            crossDomain: true
        })
        .done(function(data) {
            data = typeof data === 'string' ? JSON.parse(data) : data;
            whatBrowser();
            app(data);
            console.log(data);
        });
    }

    function app(data) {
        sheets = data.sheets;
        var mainTemplate = _.template(mainTmpl),
            mainHTML = mainTemplate({data: data.sheets, getVideo: getVideo, videos: videos, getVideoNew: getVideoNew, width: viewportSize.getWidth()}),
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

        $(".full").each(function(i, el) {
            var $el = $(el).find("video");
            if($el.length > 0 && !$el.closest(".full").hasClass("top")) {
                dom.videos.breaks[$el.closest(".full").attr("id")] = $el;
            }
        });

        dom.videos.intro = $("#full-intro video");

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
            dom.audio[$el.attr("id").slice(6)] = $el;
        });

        dom.navigation = {};
        dom.navigation['container'] = $(".nav");

        rightTop = parseInt($("#css-rc").css("top"));
        stickyTop = parseInt($("#css").css("top"), 10);

        dom.intro = {}
        dom.intro['right'] = $("#intro .right-container");
        dom.intro['div'] = $("#intro");

        // console.log(dom);
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

        if(!mobile && !tablet && viewportSize.getWidth() > 980) {

            $(window).scroll(_.debounce(update, 500));

            $(window).scroll(_.throttle(function() {
                stickDivs(window.scrollY);
            }, 50));

            $(window).resize(_.throttle(function() {
                resizeVideos();
                saveSelectors();
            }, 100));

            $(".large-break-scroll").click(function(e) {
                $("html,body").animate({scrollTop: $(e.target).closest(".full").next(".int-container").find(".chapter").offset().top + 20}, 600);
            }); 

            resizeVideos();

            dom.videos.intro.get(0).oncanplay = function() {
                setTimeout(function() {
                    $(".title-box").addClass("visible");

                    setTimeout(function() {
                        $(".int-top-logo").addClass("visible");
                        setTimeout(function() {
                            $("#full-intro .large-break-scroll").addClass("scroll-visible");
                        }, 1000);
                    }, 1000);
                }, 22000);


                dom.videos.intro.get(0).onended = function() {
                    dom.videos.intro.remove();
                    $("#full-intro .video-wrapper").css("background-image", "url('@@assetPath@@/imgs/intro.png')");
                }
            }
        }

        var chp2Width = $("#chapter-2").width(),
            chp2RCWidth = $("#chapter-2 .right-container").width(),
            chp2TWidth = $("#chapter-2 .text").width();

        if(chp2Width - (chp2RCWidth + chp2TWidth) > 40) {
            $("head").append("<style>.text { width: " + (chp2Width - chp2RCWidth - 60) + "px; }</style>");
        }

        $window.resize(_.debounce(function(){
            chp2Width = $("#chapter-2").width();
            chp2RCWidth = $("#chapter-2 .right-container").width();
            chp2TWidth = $("#chapter-2 .text").width();
            // console.log(viewportSize.getWidth(), windowWidth);
            if((viewportSize.getWidth() > 980 && windowWidth < 980) || (viewportSize.getWidth() < 980 && windowWidth > 980) ) {
                location.reload();
            }
            windowWidth = viewportSize.getWidth();
            console.log(chp2Width - (chp2RCWidth + chp2TWidth), chp2Width - (chp2RCWidth + chp2TWidth));
            if(viewportSize.getWidth() > 980 && (chp2Width - (chp2RCWidth + chp2TWidth) > 40 || chp2Width - (chp2RCWidth + chp2TWidth) < 20)) {
                $("head").append("<style>.text { width: " + (chp2Width - chp2RCWidth - 60) + "px; }</style>");
            }
        }, 500));

        $window.on("orientationchange", _.debounce(function(){
            location.reload();
            windowWidth = viewportSize.getWidth();
        }, 500));

        setAudioLevels();

        if((mobile || tablet) || viewportSize.getWidth() < 980) {
            anchorReplace();
        }

        if(mobile || tablet || viewportSize.getWidth() < 980) {
            _.each(dom.videos.breaks, function($el, key) {
                $el.prop("controls", true);
            });
            dom.videos.intro.prop("controls", true);
            dom.videos.intro.prop("autoplay", false);
        }

        if(tablet || mobile) {
            $("head").append("<style>.full video, .full { height:" + viewportSize.getWidth()/(16/9) + "px; }</style>");
            $("#full-intro .video-wrapper").css("position", "absolute");
        }

        if(tablet && viewportSize.getWidth() > 980) {
            $("head").append("<style>.text { width: 100%; max-width: 620px; } .right-container { display: none; } .mute { display: none; }</style>");
        }

        $("#show-credits").click(function() {
            $(".column").addClass("credits-visible");
            $(".int-bottom-logo").css("opacity", "0");
            $("#show-credits").css("opacity", "0");
        });

        // dom.videos.chapters['chapter-1'].get(0).addEventListener('loadeddata', function() {
        //     resizeVideos();
        // }, false);

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

    function update() {
        var currentScrollY = window.scrollY;

        navStuff(currentScrollY);
        videoControl(currentScrollY);
        anchorsAction(currentScrollY);
        // stickDivs(currentScrollY);
    }

    function anchorReplace() {
        // _.each(dom.anchors, function(val, key) {
        //     var $el = val;

        //     $el.after("<div class='mobile-alt' style='background-image: url(\"" + getAltImage($el.data('mobile-alt')) + "\");'></img>");
        //     $el.remove();
        // });
    }

    function setAudioLevels() {
        _.each(dom.audio, function($el, key) {
            if(key === "full-intro") {
                $el.get(0).volume = volumes.audio;
            } else {
                $el.get(0).volume = 0;
            }
        });

        $("video").each(function(i, el) {
            el.volume = volumes.videos;
        });
    }

    function stickDivs(scrollY) {
        _.each(dom.chapters, function(val, key) {
            var $div = val,
                $divRC = $div.children(".right-container"),
                divHeight = $div.height(),
                divOffset = $div.offset().top;

            if(key !== "intro") {
                if(divOffset + divHeight - stickyTop <= scrollY + $divRC.height()) {
                    $divRC.addClass("right-container--bottom");
                    $div.addClass("bottom");
                } else {
                    $divRC.removeClass("right-container--bottom");
                    $div.removeClass("bottom");
                }

                if(divOffset - (stickyTop - rightTop) <= scrollY) {
                    $divRC.addClass("right-container--sticky");
                    $div.addClass("stuck");
                } else {
                    $divRC.removeClass("right-container--sticky");
                    $div.removeClass("stuck");
                }
            }

            if(divOffset - 500 <= scrollY && (divOffset + divHeight) - 500 >= scrollY) {
                $divRC.addClass("visible");
            } else {
                $divRC.removeClass("visible");
            }

        });

        _.each(dom.videos.breaks, function($el, key) {
            var $full = $el.closest(".full");
            if($full.offset().top <= $window.scrollTop() && key !== "head-4") {
                $el.parent(".video-wrapper").css("position", "fixed");

                if($full.offset().top + $full.height() >= $window.scrollTop()) {
                    $full.addClass("js-fixed");
                } else {
                    $full.removeClass("js-fixed");
                }

                if(fixed[key] !== true) {
                    fixed[key] = true;

                    setTimeout(function() {
                        $full.find(".large-break-title").addClass("visible");
                    }, 500);

                    setTimeout(function() {
                        $full.find(".large-break").addClass("visible");
                    }, 1000);

                    setTimeout(function() {
                        $full.find(".large-break-scroll").addClass("scroll-visible");
                        $.scrollLock(false);

                    }, 1500);

                    $full[0].scrollIntoView();
                    $.scrollLock(true);
                }
            } else {
                $el.parent(".video-wrapper").css("position", "absolute");
                $full.removeClass("js-fixed");
            }
        });

        // if(!pastIntro && window.scrollY > $("#intro").offset().top + 20) {
        //     window.scrollTo(0, $("#intro").offset().top + 20);
        //     $.scrollLock(true);
        //     pastIntro = true;

        //     setTimeout(function() {
        //         $.scrollLock(false);
        //     }, 1000);
        // }

        if(window.scrollY > dom.intro['div'].offset().top) {
            dom.intro['right'].addClass("right-container--sticky");

            if(dom.intro['div'].offset().top + dom.intro['div'].height() < window.scrollY) {
                dom.intro['right'].addClass("right-container--bottom");
            } else {
                dom.intro['right'].removeClass("right-container--bottom");
            }
        } else {
            dom.intro['right'].removeClass("right-container--sticky");
            dom.intro['right'].removeClass("right-container--bottom");
        }
    }

    function videoControl(scrollY) {
        _.each(dom.videos.breaks, function(val, key) {
            var $el = val,
                $elParent = $el.closest(".full");

            if(($elParent.offset().top - $window.height() + 500 <= scrollY && $window.scrollTop() + 500 < $elParent.offset().top + $elParent.height())) {
                // $el.parent().css("opacity", "1");
                // $el.get(0).volume = 1;
                if($el.get(0).paused) {
                    $el.prop("volume", 0);
                    $el.get(0).load();
                    $el.get(0).play();
                    $el.animate({volume: volumes.videos}, 1000);
                    $el.css("display", "block");
                }
            } else {
                // $el.parent().css("opacity", "0");
                if(!$el.get(0).paused) {
                    $el.animate({volume: 0}, 1000);
                    setTimeout(function() {
                        $el.get(0).pause();
                    }, 1000);
                    $el.css("display", "none");
                }
            }
        });

        _.each(dom.videos.chapters, function(val, key) {
            var $el = val,
                $elParent = $el.closest(".right-container");

            if($elParent.hasClass("right-container--sticky") && !$elParent.hasClass("right-container--bottom")) {
                if($el.get(0).paused) {
                    $el.prop("volume", 0);
                    $el.get(0).play();
                    $el.animate({volume: volumes.videos}, 1000);
                    $el.css("display", "block");
                }
            } else {
                if(!$el.get(0).paused) {
                    $el.animate({volume: volumes.videos}, 1000);
                    setTimeout(function() {
                        $el.get(0).pause();
                    }, 1000);
                    $el.css("display", "none");
                }
            }
        });

        if(dom.videos.intro.get(0) && scrollY > $window.height() && viewportSize.getWidth() > 980) {
            dom.videos.intro.get(0).pause();
            dom.videos.intro.remove();
            $("#full-intro .video-wrapper").css("background-image", "url('@@assetPath@@/imgs/intro.png')");
            $(".title-box").addClass("visible");
        }
    }

    function muteVideo() {
        mute = (mute) ? false : true;
        _.each(dom.videos.breaks, function($el, key) {
            $el.get(0).muted = mute;
        });
        _.each(dom.videos.chapters, function($el, key) {
            $el.get(0).muted = mute;
        });
        _.each(dom.audio, function($el, key) {
            $el.get(0).muted = mute;
        });

        if(dom.videos.intro.get(0)) {
            dom.videos.intro.get(0).muted = mute;
        }

        if(mute === true) {
            $(".mute").addClass("muted");
        } else {
            $(".mute").removeClass("muted");
        }
    }

    function resizeVideos() {
        $("head").append("<style type='text/css'>.right-container video { margin-left: " + (-(dom.videos.chapters['chapter-1'].closest(".right-container").height()*(16/9) - dom.videos.chapters['chapter-1'].closest(".right-container").width())/2) + "px;}</style>");
        if(1.78 < $body.width() / $body.height()) {
            $body.removeClass("non-wide");

            $("head style").append(".full video { margin-left: " + 0 + "px;}");

            // videos
            // _.each(dom.videos.chapters, function($el, key) {
            //     $el.css("margin-left", (-($el.width() - $el.parent(".right-container").width())/2));
            // });
        } else {
            $body.addClass("non-wide");

            // _.each(dom.videos.breaks, function($el, key) {
            //     $el.css("margin-left", (-($el.width() - $body.width())/2));
            // });

            // dom.videos.intro.css("margin-left", -(($body.height()*(16/9) - $body.width()))/2);

            $("head style").append(".full video { margin-left: " + -((($body.height()*(16/9) - $body.width()))/2) + "px;}");
        }
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
                // dom.navigation.container.addClass("nav--show");

                // $("#span-1").addClass("highlight");

                // setTimeout(function() {
                //     $("#span-2").addClass("highlight");
                // }, 500);

                // setTimeout(function() {
                //     $("#span-3").addClass("highlight");
                // }, 1000);

                // setTimeout(function() {
                //     $("#span-4").addClass("highlight");
                // }, 1500);

            } else if(key === "full-intro") {
                // dom.navigation.container.removeClass("nav--show");
            }
        });

        if(section) {
            // _.each(dom.audio, function($el, key) {
            //     if(currentAudio.slice(-1) !== key.slice(-1) && !$el.get(0).paused) {
            //         $el.animate({volume: 0}, 1000, function () {
            //             console.log(currentAudio, key, "done");
            //             $el.get(0).pause();
            //         });
            //     }
            // });
            // dom.audio["chapter-" + section.slice(-1)].animate({volume: 1}, 1000, function() {
            //     dom.audio["chapter-" + section.slice(-1)].get(0).play();
            // });

            _.each(dom.audio, function($el, key) {
                if(currentAudio !== section) {

                    if(currentAudio !== "head-4") {
                        var toPause = currentAudio;
                        dom.audio[currentAudio].animate({volume: 0}, 3000, function () {
                            dom.audio[toPause].get(0).pause();
                        });
                    }

                    if(section !== "head-4") {
                        dom.audio[section].get(0).play();
                        dom.audio[section].animate({volume: volumes.audio}, 3000);
                    }

                    currentAudio = section;
                }
            });
        }
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
                if($el.offset().top - ($window.height()*0.333) < scrollY) {
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

            } else if(lastAnchors[chapterName] === "" && dom.text[chapterName] && !dom.text[chapterName].hasClass("first")) {
                delete currentAnchors[chapterName];
                dom.text[chapterName].addClass("first");
                changeVideo(dom.text[chapterName]);
            }
        });
    }

    function preLoad() {
        var imagesLoaded = 0;
        // _.each(images, function(val, key) {
        //     var key = new Image(1,1);
        //     key.onload = function() {
        //         imagesLoaded++;
        //         if(imagesLoaded === _.keys(images).length) {
        //             onLoaded();
        //         }
        //     }
        //     key.src = val.high;
        // });

        // sheets['chapter1'].map(function(row) {
        //     if(row.anchor !== "") {
        //          var key = new Image(1,1);
        //         key.src = "http://multimedia.guardianapis.com/interactivevideos/video.php?file=" + row.anchor + "&format=video/mp4&maxbitrate=2048&poster=1;";
        //     }
        // });

        // if(mobile || tablet) {
        //     _.each(altImages, function(val, key) {
        //         var key = new Image(1,1);
        //         key.onload = function() {
        //         }
        //         key.src = val.high;
        //     });
        // }
    }

    function changeImage($anchor) {
        var $chapter = $anchor.closest(".chapter");

        $chapter.find(".right-container").append("<img class='waiting'/>");
        $chapter.find("img.waiting").attr('src', getImage($anchor.attr("name")));

        setTimeout(function() {
           $chapter.find("img.waiting").removeClass("waiting").addClass("top-layer");

           setTimeout(function() {
                $chapter.find(".top-layer").first().remove();
            }, 1000);
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
        var $chapter = $anchor.closest(".chapter"),
            name = $anchor.attr("name");

        $chapter.find(".right-container").prepend(getVideoNew(name, "waiting", true, true));

        var $videoWrapper = $chapter.find("#" + name);

        dom.videos.chapters[$chapter.attr("id")] = $videoWrapper.find("video");
        dom.videos.chapters[$chapter.attr("id")].prop("volume", 0);

        $videoWrapper.removeClass("waiting").addClass("top-layer");

        var $save = $chapter.find(".top-layer").slice(1);

        dom.videos.chapters[$chapter.attr("id")].on('canplay', function() {
            // if($save.find("video").length > 0) { $save.find("video").get(0).pause(); }
            $save.addClass("fade-out");
            $save.find("video").animate({volume: 0}, 1000);

            dom.videos.chapters[$chapter.attr("id")].animate({volume: volumes.videos}, 1000);

            setTimeout(function() {
                $save.remove();
            }, 1000);
        });
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

    function getVideo(name, className, autoplay) {
        var mutedTag = (mute) ? "muted" : "",
            classTag =  (className) ? className : "",
            posterTag = (videos[name].poster !== "") ? "poster='" + videos[name].poster + "'" : "",
            autoplayTag = (autoplay) ? "autoplay" : "",
            src = {};
        src.mp4 = (videos[name].mp4) ? "<source src='" + videos[name].mp4 + "' type='video/mp4'>" : "";
        src.webm = (videos[name].webm) ? "<source src='" + videos[name].webm + "' type='video/webm'>" : "";

        return "<div class='video-wrapper " + classTag + "' style='background-image: url(\"" + videos[name].poster + "\");'><video preload='metadata' " + mutedTag + posterTag + " loop " + autoplayTag + ">" + src.mp4 + src.webm + "</video></div>";
    }

    function getVideoNew(name, className, autoplay, loop) {
        var mutedTag = (mute) ? " muted " : "",
            classTag =  (className) ? className : "",
            posterTag = "poster='http://multimedia.guardianapis.com/interactivevideos/video.php?file=" + name + "&format=video/mp4&maxbitrate=1024&poster=1'",
            autoplayTag = (autoplay) ? "autoplay" : "",
            loopTag = (loop) ? " loop " : "",
            src = {}; 
        src.mp4 = "<source src='http://multimedia.guardianapis.com/interactivevideos/video.php?file=" + name + "&format=video/mp4&maxbitrate=2048' type='video/mp4'>";
        // src.ogg = "<source src='http://multimedia.guardianapis.com/interactivevideos/video.php?file=" + name + "&format=video/ogg&maxbitrate=2048' type='video/ogg'>";
        src.webm = "<source src='http://multimedia.guardianapis.com/interactivevideos/video.php?file=" + name + "&format=video/webm&maxbitrate=2048' type='video/webm'>";
        return "<div id='" + name +"' class='video-wrapper " + classTag + "' style='background-image: url(\"http://multimedia.guardianapis.com/interactivevideos/video.php?file=" + name + "&format=video/mp4&maxbitrate=1024&poster=1\");'><video preload='metadata' " + mutedTag + posterTag + loopTag + autoplayTag + " >" + src.mp4 + src.webm + "</video></div>";
    }

    $.scrollLock = ( function scrollLockClosure() {
        'use strict';

        var $html      = $( 'html' ),
            // State: unlocked by default
            locked     = false,
            // State: scroll to revert to
            prevScroll = {
                scrollLeft : $( window ).scrollLeft(),
                scrollTop  : $( window ).scrollTop()
            },
            // State: styles to revert to
            prevStyles = {},
            lockStyles = {
                'overflow-y' : 'scroll',
                'position'   : 'fixed',
                'width'      : '100%'
            };

        // Instantiate cache in case someone tries to unlock before locking
        saveStyles();

        // Save context's inline styles in cache
        function saveStyles() {
            var styleAttr = $html.attr( 'style' ),
                styleStrs = [],
                styleHash = {};

            if( !styleAttr ){
                return;
            }

            styleStrs = styleAttr.split( /;\s/ );

            $.each( styleStrs, function serializeStyleProp( styleString ){
                if( !styleString ) {
                    return;
                }

                var keyValue = styleString.split( /\s:\s/ );

                if( keyValue.length < 2 ) {
                    return;
                }

                styleHash[ keyValue[ 0 ] ] = keyValue[ 1 ];
            } );

            $.extend( prevStyles, styleHash );
        }

        function lock() {
            var appliedLock = {};

            // Duplicate execution will break DOM statefulness
            if( locked ) {
                return;
            }

            // Save scroll state...
            prevScroll = {
                scrollLeft : $( window ).scrollLeft(),
                scrollTop  : $( window ).scrollTop()
            };

            // ...and styles
            saveStyles();

            // Compose our applied CSS
            $.extend( appliedLock, lockStyles, {
                // And apply scroll state as styles
                'left' : - prevScroll.scrollLeft + 'px',
                'top'  : - prevScroll.scrollTop  + 'px'
            } );

            // Then lock styles...
            $html.css( appliedLock );

            // ...and scroll state
            $( window )
                .scrollLeft( 0 )
                .scrollTop( 0 );

            locked = true;
        }

        function unlock() {
            // Duplicate execution will break DOM statefulness
            if( !locked ) {
                return;
            }

            // Revert styles
            $html.attr( 'style', $( '<x>' ).css( prevStyles ).attr( 'style' ) || '' );

            // Revert scroll values
            $( window )
                .scrollLeft( prevScroll.scrollLeft )
                .scrollTop(  prevScroll.scrollTop );

            locked = false;
        }

        return function scrollLock( on ) {
            // If an argument is passed, lock or unlock depending on truthiness
            if( arguments.length ) {
                if( on ) {
                    lock();
                }
                else {
                    unlock();
                }
            }
            // Otherwise, toggle
            else {
                if( locked ){
                    unlock();
                }
                else {
                    lock();
                }
            }
        };
    }() );

    return {
        init: init
    };
});
