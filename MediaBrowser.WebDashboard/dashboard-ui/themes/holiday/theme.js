define(["appSettings", "backdrop", "browser", "globalize", "require", "events", "paper-icon-button-light"], function(appSettings, backdrop, browser, globalize, require, events) {
        "use strict";

        function onPageShow() {
            if (!browser.mobile) {
                if ("off" == getHolidayTheme()) return;
                var page = this;
                require(["css!./style.css"]), page.classList.contains("itemDetailPage") || setBackdrop(page), playThemeMusic(), addSnowflakes(), addIcon(), setBodyClass()
            }
        }

        function playThemeMusic() {
            "off" != getHolidayTheme() && (0 == lastSound ? playSound("https://github.com/MediaBrowser/Emby.Resources/raw/master/themes/holiday/christmas.wav", .1) : (new Date).getTime() - lastSound > 3e4 && playSound("https://github.com/MediaBrowser/Emby.Resources/raw/master/themes/holiday/sleighbells.wav", .25))
        }

        function destroyTheme() {
            document.documentElement.classList.remove("christmas"), stopSnowflakes(), currentSound && currentSound.stop();
            var holidayInfoButton = document.querySelector(".holidayInfoButton");
            holidayInfoButton && holidayInfoButton.parentNode.removeChild(holidayInfoButton), backdrop.clear(), window.location.reload(!0)
        }

        function addSnowflakes() {
            snowFlakesInitialized || (snowFlakesInitialized = !0, document.body.insertAdjacentHTML("beforeend", '<div id="snowflakeContainer"><p class="snowflake">*</p></div>'), generateSnowflakes(), events.on(MediaController, "beforeplaybackstart", onPlaybackStart))
        }

        function onPlaybackStart() {
            currentSound && currentSound.stop(), stopSnowflakes()
        }

        function setBackdrop(page) {
            page.classList.contains("itemDetailPage") || ("christmas" == getHolidayTheme() ? backdrop.setBackdrop("https://raw.githubusercontent.com/MediaBrowser/Emby.Resources/master/themes/holiday/bgc.jpg") : backdrop.setBackdrop("https://raw.githubusercontent.com/MediaBrowser/Emby.Resources/master/themes/holiday/bg.jpg"))
        }

        function getHolidayTheme() {
            return appSettings.get(holidayThemeKey)
        }

        function setHolidayTheme(value) {
            appSettings.set(holidayThemeKey, value), setBodyClass(), playThemeMusic()
        }

        function setBodyClass() {
            "christmas" == getHolidayTheme() ? document.documentElement.classList.add("christmas") : document.documentElement.classList.remove("christmas")
        }

        function onIconClick(e) {
            var items = [],
                current = getHolidayTheme();
            items.push({
                name: "None",
                id: "none",
                ironIcon: "off" == current ? "check" : null
            }), items.push({
                name: "Joy!",
                id: "joy",
                ironIcon: "off" != current && "christmas" != current ? "check" : null
            }), items.push({
                name: "Christmas",
                id: "christmas",
                ironIcon: "christmas" == current ? "check" : null
            }), require(["actionsheet"], function(actionsheet) {
                actionsheet.show({
                    title: "Happy holidays from the Emby team! Select your holiday theme:",
                    items: items,
                    callback: function(id) {
                        switch (id) {
                            case "none":
                                setHolidayTheme("off"), destroyTheme();
                                break;
                            case "joy":
                                setHolidayTheme(""), setBackdrop($.mobile.activePage);
                                break;
                            case "christmas":
                                setHolidayTheme("christmas"), setBackdrop($.mobile.activePage)
                        }
                    }
                })
            })
        }

        function addIcon() {
            if (!iconCreated) {
                iconCreated = !0;
                var viewMenuSecondary = document.querySelector(".viewMenuSecondary");
                if (viewMenuSecondary) {
                    var html = '<button is="paper-icon-button-light" class="holidayInfoButton"><i class="md-icon">info</i></button>';
                    viewMenuSecondary.insertAdjacentHTML("afterbegin", html), viewMenuSecondary.querySelector(".holidayInfoButton").addEventListener("click", onIconClick)
                }
            }
        }

        function playSound(path, volume) {
            require(["howler"], function(howler) {
                var sound = new Howl({
                    urls: [path],
                    volume: volume || .3
                });
                sound.play(), currentSound = sound, lastSound = (new Date).getTime()
            })
        }
        var iconCreated, currentSound, snowFlakesInitialized, lastSound = 0,
            holidayThemeKey = "holidaytheme9";
        pageClassOn("pageshow", "libraryPage", onPageShow)
    }),
    function() {
        function setup() {
            window.addEventListener("resize", setResetFlag, !1)
        }

        function getSupportedPropertyName(properties) {
            for (var i = 0; i < properties.length; i++)
                if ("undefined" != typeof document.body.style[properties[i]]) return properties[i];
            return null
        }

        function Snowflake(element, radius, speed, xPos, yPos) {
            this.element = element, this.radius = radius, this.speed = speed, this.xPos = xPos, this.yPos = yPos, this.counter = 0, this.sign = Math.random() < .5 ? 1 : -1, this.element.style.opacity = .1 + Math.random(), this.element.style.fontSize = 12 + 50 * Math.random() + "px"
        }

        function setTranslate3DTransform(element, xPosition, yPosition) {
            var val = "translate3d(" + xPosition + "px, " + yPosition + "px, 0)";
            element.style[transformProperty] = val
        }

        function generateSnowflakes() {
            var originalSnowflake = document.querySelector(".snowflake"),
                snowflakeContainer = originalSnowflake.parentNode;
            browserWidth = document.documentElement.clientWidth, browserHeight = document.documentElement.clientHeight;
            for (var i = 0; i < numberOfSnowflakes; i++) {
                var snowflakeCopy = originalSnowflake.cloneNode(!0);
                snowflakeContainer.appendChild(snowflakeCopy);
                var initialXPos = getPosition(50, browserWidth),
                    initialYPos = getPosition(50, browserHeight),
                    speed = 5 + 40 * Math.random(),
                    radius = 4 + 10 * Math.random(),
                    snowflakeObject = new Snowflake(snowflakeCopy, radius, speed, initialXPos, initialYPos);
                snowflakes.push(snowflakeObject)
            }
            snowflakeContainer.removeChild(originalSnowflake), moveSnowflakes()
        }

        function moveSnowflakes() {
            if (!stopped) {
                for (var i = 0; i < snowflakes.length; i++) {
                    var snowflake = snowflakes[i];
                    snowflake.update()
                }
                if (resetPosition) {
                    browserWidth = document.documentElement.clientWidth, browserHeight = document.documentElement.clientHeight;
                    for (var i = 0; i < snowflakes.length; i++) {
                        var snowflake = snowflakes[i];
                        snowflake.xPos = getPosition(50, browserWidth), snowflake.yPos = getPosition(50, browserHeight)
                    }
                    resetPosition = !1
                }
                requestAnimationFrame(moveSnowflakes)
            }
        }

        function getPosition(offset, size) {
            return Math.round(-1 * offset + Math.random() * (size + 2 * offset))
        }

        function setResetFlag(e) {
            resetPosition = !0
        }
        var browserWidth, browserHeight, requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame,
            transforms = ["transform", "msTransform", "webkitTransform", "mozTransform", "oTransform"],
            transformProperty = getSupportedPropertyName(transforms),
            snowflakes = [],
            numberOfSnowflakes = 50,
            resetPosition = !1;
        setup(), Snowflake.prototype.update = function() {
            this.counter += this.speed / 5e3, this.xPos += this.sign * this.speed * Math.cos(this.counter) / 40, this.yPos += Math.sin(this.counter) / 40 + this.speed / 30, setTranslate3DTransform(this.element, Math.round(this.xPos), Math.round(this.yPos)), this.yPos > browserHeight && (this.yPos = -50)
        };
        var stopped = !1;
        window.generateSnowflakes = generateSnowflakes, window.stopSnowflakes = function() {
            stopped = !0;
            for (var elems = document.querySelectorAll(".snowflake"), i = 0, length = elems.length; i < length; i++) elems[i].parentNode.removeChild(elems[i])
        }
    }();