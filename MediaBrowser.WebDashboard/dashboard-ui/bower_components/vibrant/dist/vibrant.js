define([], function() {
    "use strict";
    var CanvasImage, Swatch, Vibrant, pv = {
            map: function(array, f) {
                var o = {};
                return f ? array.map(function(d, i) {
                    return o.index = i, f.call(o, d)
                }) : array.slice()
            },
            naturalOrder: function(a, b) {
                return a < b ? -1 : a > b ? 1 : 0
            },
            sum: function(array, f) {
                var o = {};
                return array.reduce(f ? function(p, d, i) {
                    return o.index = i, p + f.call(o, d)
                } : function(p, d) {
                    return p + d
                }, 0)
            },
            max: function(array, f) {
                return Math.max.apply(null, f ? pv.map(array, f) : array)
            }
        },
        MMCQ = function() {
            function getColorIndex(r, g, b) {
                return (r << 2 * sigbits) + (g << sigbits) + b
            }

            function PQueue(comparator) {
                function sort() {
                    contents.sort(comparator), sorted = !0
                }
                var contents = [],
                    sorted = !1;
                return {
                    push: function(o) {
                        contents.push(o), sorted = !1
                    },
                    peek: function(index) {
                        return sorted || sort(), void 0 === index && (index = contents.length - 1), contents[index]
                    },
                    pop: function() {
                        return sorted || sort(), contents.pop()
                    },
                    size: function() {
                        return contents.length
                    },
                    map: function(f) {
                        return contents.map(f)
                    },
                    debug: function() {
                        return sorted || sort(), contents
                    }
                }
            }

            function VBox(r1, r2, g1, g2, b1, b2, histo) {
                var vbox = this;
                vbox.r1 = r1, vbox.r2 = r2, vbox.g1 = g1, vbox.g2 = g2, vbox.b1 = b1, vbox.b2 = b2, vbox.histo = histo
            }

            function CMap() {
                this.vboxes = new PQueue(function(a, b) {
                    return pv.naturalOrder(a.vbox.count() * a.vbox.volume(), b.vbox.count() * b.vbox.volume())
                })
            }

            function getHisto(pixels) {
                var index, rval, gval, bval, histosize = 1 << 3 * sigbits,
                    histo = new Array(histosize);
                return pixels.forEach(function(pixel) {
                    rval = pixel[0] >> rshift, gval = pixel[1] >> rshift, bval = pixel[2] >> rshift, index = getColorIndex(rval, gval, bval), histo[index] = (histo[index] || 0) + 1
                }), histo
            }

            function vboxFromPixels(pixels, histo) {
                var rval, gval, bval, rmin = 1e6,
                    rmax = 0,
                    gmin = 1e6,
                    gmax = 0,
                    bmin = 1e6,
                    bmax = 0;
                return pixels.forEach(function(pixel) {
                    rval = pixel[0] >> rshift, gval = pixel[1] >> rshift, bval = pixel[2] >> rshift, rval < rmin ? rmin = rval : rval > rmax && (rmax = rval), gval < gmin ? gmin = gval : gval > gmax && (gmax = gval), bval < bmin ? bmin = bval : bval > bmax && (bmax = bval)
                }), new VBox(rmin, rmax, gmin, gmax, bmin, bmax, histo)
            }

            function medianCutApply(histo, vbox) {
                function doCut(color) {
                    var left, right, vbox1, vbox2, d2, dim1 = color + "1",
                        dim2 = color + "2",
                        count2 = 0;
                    for (i = vbox[dim1]; i <= vbox[dim2]; i++)
                        if (partialsum[i] > total / 2) {
                            for (vbox1 = vbox.copy(), vbox2 = vbox.copy(), left = i - vbox[dim1], right = vbox[dim2] - i, d2 = left <= right ? Math.min(vbox[dim2] - 1, ~~(i + right / 2)) : Math.max(vbox[dim1], ~~(i - 1 - left / 2)); !partialsum[d2];) d2++;
                            for (count2 = lookaheadsum[d2]; !count2 && partialsum[d2 - 1];) count2 = lookaheadsum[--d2];
                            return vbox1[dim2] = d2, vbox2[dim1] = vbox1[dim2] + 1, [vbox1, vbox2]
                        }
                }
                var vBoxCount = vbox.count();
                if (vBoxCount) {
                    var rw = vbox.r2 - vbox.r1 + 1,
                        gw = vbox.g2 - vbox.g1 + 1,
                        bw = vbox.b2 - vbox.b1 + 1,
                        maxw = pv.max([rw, gw, bw]);
                    if (1 === vBoxCount) return [vbox.copy()];
                    var i, j, k, sum, index, total = 0,
                        partialsum = [],
                        lookaheadsum = [];
                    if (maxw === rw)
                        for (i = vbox.r1; i <= vbox.r2; i++) {
                            for (sum = 0, j = vbox.g1; j <= vbox.g2; j++)
                                for (k = vbox.b1; k <= vbox.b2; k++) index = getColorIndex(i, j, k), sum += histo[index] || 0;
                            total += sum, partialsum[i] = total
                        } else if (maxw === gw)
                            for (i = vbox.g1; i <= vbox.g2; i++) {
                                for (sum = 0, j = vbox.r1; j <= vbox.r2; j++)
                                    for (k = vbox.b1; k <= vbox.b2; k++) index = getColorIndex(j, i, k), sum += histo[index] || 0;
                                total += sum, partialsum[i] = total
                            } else
                                for (i = vbox.b1; i <= vbox.b2; i++) {
                                    for (sum = 0, j = vbox.r1; j <= vbox.r2; j++)
                                        for (k = vbox.g1; k <= vbox.g2; k++) index = getColorIndex(j, k, i), sum += histo[index] || 0;
                                    total += sum, partialsum[i] = total
                                }
                    return partialsum.forEach(function(d, i) {
                        lookaheadsum[i] = total - d
                    }), doCut(maxw === rw ? "r" : maxw === gw ? "g" : "b")
                }
            }

            function quantize(pixels, maxcolors) {
                function iter(lh, target) {
                    for (var vbox, ncolors = 1, niters = 0; niters < maxIterations;)
                        if (vbox = lh.pop(), vbox.count()) {
                            var vboxes = medianCutApply(histo, vbox),
                                vbox1 = vboxes[0],
                                vbox2 = vboxes[1];
                            if (!vbox1) return;
                            if (lh.push(vbox1), vbox2 && (lh.push(vbox2), ncolors++), ncolors >= target) return;
                            if (niters++ > maxIterations) return
                        } else lh.push(vbox), niters++
                }
                if (!pixels.length || maxcolors < 2 || maxcolors > 256) return !1;
                var histo = getHisto(pixels),
                    nColors = 0;
                histo.forEach(function() {
                    nColors++
                });
                var vbox = vboxFromPixels(pixels, histo),
                    pq = new PQueue(function(a, b) {
                        return pv.naturalOrder(a.count(), b.count())
                    });
                pq.push(vbox), iter(pq, fractByPopulations * maxcolors);
                for (var pq2 = new PQueue(function(a, b) {
                        return pv.naturalOrder(a.count() * a.volume(), b.count() * b.volume())
                    }); pq.size();) pq2.push(pq.pop());
                iter(pq2, maxcolors - pq2.size());
                for (var cmap = new CMap; pq2.size();) cmap.push(pq2.pop());
                return cmap
            }
            var sigbits = 5,
                rshift = 8 - sigbits,
                maxIterations = 1e3,
                fractByPopulations = .75;
            return VBox.prototype = {
                volume: function(force) {
                    var vbox = this;
                    return vbox._volume && !force || (vbox._volume = (vbox.r2 - vbox.r1 + 1) * (vbox.g2 - vbox.g1 + 1) * (vbox.b2 - vbox.b1 + 1)), vbox._volume
                },
                count: function(force) {
                    var vbox = this,
                        histo = vbox.histo;
                    if (!vbox._count_set || force) {
                        var i, j, k, index, npix = 0;
                        for (i = vbox.r1; i <= vbox.r2; i++)
                            for (j = vbox.g1; j <= vbox.g2; j++)
                                for (k = vbox.b1; k <= vbox.b2; k++) index = getColorIndex(i, j, k), npix += histo[index] || 0;
                        vbox._count = npix, vbox._count_set = !0
                    }
                    return vbox._count
                },
                copy: function() {
                    var vbox = this;
                    return new VBox(vbox.r1, vbox.r2, vbox.g1, vbox.g2, vbox.b1, vbox.b2, vbox.histo)
                },
                avg: function(force) {
                    var vbox = this,
                        histo = vbox.histo;
                    if (!vbox._avg || force) {
                        var hval, i, j, k, histoindex, ntot = 0,
                            mult = 1 << 8 - sigbits,
                            rsum = 0,
                            gsum = 0,
                            bsum = 0;
                        for (i = vbox.r1; i <= vbox.r2; i++)
                            for (j = vbox.g1; j <= vbox.g2; j++)
                                for (k = vbox.b1; k <= vbox.b2; k++) histoindex = getColorIndex(i, j, k), hval = histo[histoindex] || 0, ntot += hval, rsum += hval * (i + .5) * mult, gsum += hval * (j + .5) * mult, bsum += hval * (k + .5) * mult;
                        ntot ? vbox._avg = [~~(rsum / ntot), ~~(gsum / ntot), ~~(bsum / ntot)] : vbox._avg = [~~(mult * (vbox.r1 + vbox.r2 + 1) / 2), ~~(mult * (vbox.g1 + vbox.g2 + 1) / 2), ~~(mult * (vbox.b1 + vbox.b2 + 1) / 2)]
                    }
                    return vbox._avg
                },
                contains: function(pixel) {
                    var vbox = this,
                        rval = pixel[0] >> rshift;
                    return gval = pixel[1] >> rshift, bval = pixel[2] >> rshift, rval >= vbox.r1 && rval <= vbox.r2 && gval >= vbox.g1 && gval <= vbox.g2 && bval >= vbox.b1 && bval <= vbox.b2
                }
            }, CMap.prototype = {
                push: function(vbox) {
                    this.vboxes.push({
                        vbox: vbox,
                        color: vbox.avg()
                    })
                },
                palette: function() {
                    return this.vboxes.map(function(vb) {
                        return vb.color
                    })
                },
                size: function() {
                    return this.vboxes.size()
                },
                map: function(color) {
                    for (var vboxes = this.vboxes, i = 0; i < vboxes.size(); i++)
                        if (vboxes.peek(i).vbox.contains(color)) return vboxes.peek(i).color;
                    return this.nearest(color)
                },
                nearest: function(color) {
                    for (var d1, d2, pColor, vboxes = this.vboxes, i = 0; i < vboxes.size(); i++) d2 = Math.sqrt(Math.pow(color[0] - vboxes.peek(i).color[0], 2) + Math.pow(color[1] - vboxes.peek(i).color[1], 2) + Math.pow(color[2] - vboxes.peek(i).color[2], 2)), (d2 < d1 || void 0 === d1) && (d1 = d2, pColor = vboxes.peek(i).color);
                    return pColor
                },
                forcebw: function() {
                    var vboxes = this.vboxes;
                    vboxes.sort(function(a, b) {
                        return pv.naturalOrder(pv.sum(a.color), pv.sum(b.color))
                    });
                    var lowest = vboxes[0].color;
                    lowest[0] < 5 && lowest[1] < 5 && lowest[2] < 5 && (vboxes[0].color = [0, 0, 0]);
                    var idx = vboxes.length - 1,
                        highest = vboxes[idx].color;
                    highest[0] > 251 && highest[1] > 251 && highest[2] > 251 && (vboxes[idx].color = [255, 255, 255])
                }
            }, {
                quantize: quantize
            }
        }(),
        bind = function(fn, me) {
            return function() {
                return fn.apply(me, arguments)
            }
        },
        slice = [].slice;
    window.Swatch = Swatch = function() {
        function Swatch(rgb, population) {
            this.rgb = rgb, this.population = population
        }
        return Swatch.prototype.hsl = void 0, Swatch.prototype.rgb = void 0, Swatch.prototype.population = 1, Swatch.yiq = 0, Swatch.prototype.getHsl = function() {
            return this.hsl || (this.hsl = Vibrant.rgbToHsl(this.rgb[0], this.rgb[1], this.rgb[2])), this.hsl
        }, Swatch.prototype.getPopulation = function() {
            return this.population
        }, Swatch.prototype.getRgb = function() {
            return this.rgb
        }, Swatch.prototype.getHex = function() {
            return "#" + ((1 << 24) + (this.rgb[0] << 16) + (this.rgb[1] << 8) + this.rgb[2]).toString(16).slice(1, 7)
        }, Swatch.prototype.getTitleTextColor = function() {
            return this._ensureTextColors(), this.yiq < 200 ? "#fff" : "#000"
        }, Swatch.prototype.getBodyTextColor = function() {
            return this._ensureTextColors(), this.yiq < 150 ? "#fff" : "#000"
        }, Swatch.prototype._ensureTextColors = function() {
            if (!this.yiq) return this.yiq = (299 * this.rgb[0] + 587 * this.rgb[1] + 114 * this.rgb[2]) / 1e3, this.yiq
        }, Swatch
    }(), window.Vibrant = Vibrant = function() {
        function Vibrant(sourceImage, colorCount, quality) {
            this.swatches = bind(this.swatches, this);
            var a, allPixels, b, cmap, g, i, image, imageData, offset, pixelCount, pixels, r;
            "undefined" == typeof colorCount && (colorCount = 16), "undefined" == typeof quality && (quality = 5), image = new CanvasImage(sourceImage);
            try {
                for (imageData = image.getImageData(), pixels = imageData.data, pixelCount = image.getPixelCount(), allPixels = [], i = 0; i < pixelCount;) offset = 4 * i, r = pixels[offset + 0], g = pixels[offset + 1], b = pixels[offset + 2], a = pixels[offset + 3], a >= 125 && (r > 250 && g > 250 && b > 250 || allPixels.push([r, g, b])), i += quality;
                cmap = this.quantize(allPixels, colorCount), this._swatches = (cmap.vboxes || []).map(function(_this) {
                    return function(vbox) {
                        return new Swatch(vbox.color, vbox.vbox.count())
                    }
                }(this)), this.maxPopulation = this.findMaxPopulation, this.generateVarationColors(), this.generateEmptySwatches()
            } finally {
                image.removeCanvas()
            }
        }
        return Vibrant.prototype.quantize = MMCQ.quantize, Vibrant.prototype._swatches = [], Vibrant.prototype.TARGET_DARK_LUMA = .26, Vibrant.prototype.MAX_DARK_LUMA = .45, Vibrant.prototype.MIN_LIGHT_LUMA = .55, Vibrant.prototype.TARGET_LIGHT_LUMA = .74, Vibrant.prototype.MIN_NORMAL_LUMA = .3, Vibrant.prototype.TARGET_NORMAL_LUMA = .5, Vibrant.prototype.MAX_NORMAL_LUMA = .7, Vibrant.prototype.TARGET_MUTED_SATURATION = .3, Vibrant.prototype.MAX_MUTED_SATURATION = .4, Vibrant.prototype.TARGET_VIBRANT_SATURATION = 1, Vibrant.prototype.MIN_VIBRANT_SATURATION = .35, Vibrant.prototype.WEIGHT_SATURATION = 3, Vibrant.prototype.WEIGHT_LUMA = 6, Vibrant.prototype.WEIGHT_POPULATION = 1, Vibrant.prototype.VibrantSwatch = void 0, Vibrant.prototype.MutedSwatch = void 0, Vibrant.prototype.DarkVibrantSwatch = void 0, Vibrant.prototype.DarkMutedSwatch = void 0, Vibrant.prototype.LightVibrantSwatch = void 0, Vibrant.prototype.LightMutedSwatch = void 0, Vibrant.prototype.HighestPopulation = 0, Vibrant.prototype.generateVarationColors = function() {
            return this.VibrantSwatch = this.findColorVariation(this.TARGET_NORMAL_LUMA, this.MIN_NORMAL_LUMA, this.MAX_NORMAL_LUMA, this.TARGET_VIBRANT_SATURATION, this.MIN_VIBRANT_SATURATION, 1), this.LightVibrantSwatch = this.findColorVariation(this.TARGET_LIGHT_LUMA, this.MIN_LIGHT_LUMA, 1, this.TARGET_VIBRANT_SATURATION, this.MIN_VIBRANT_SATURATION, 1), this.DarkVibrantSwatch = this.findColorVariation(this.TARGET_DARK_LUMA, 0, this.MAX_DARK_LUMA, this.TARGET_VIBRANT_SATURATION, this.MIN_VIBRANT_SATURATION, 1), this.MutedSwatch = this.findColorVariation(this.TARGET_NORMAL_LUMA, this.MIN_NORMAL_LUMA, this.MAX_NORMAL_LUMA, this.TARGET_MUTED_SATURATION, 0, this.MAX_MUTED_SATURATION), this.LightMutedSwatch = this.findColorVariation(this.TARGET_LIGHT_LUMA, this.MIN_LIGHT_LUMA, 1, this.TARGET_MUTED_SATURATION, 0, this.MAX_MUTED_SATURATION), this.DarkMutedSwatch = this.findColorVariation(this.TARGET_DARK_LUMA, 0, this.MAX_DARK_LUMA, this.TARGET_MUTED_SATURATION, 0, this.MAX_MUTED_SATURATION), this.DarkMutedSwatch
        }, Vibrant.prototype.generateEmptySwatches = function() {
            var hsl;
            if (void 0 === this.VibrantSwatch && void 0 !== this.DarkVibrantSwatch && (hsl = this.DarkVibrantSwatch.getHsl(), hsl[2] = this.TARGET_NORMAL_LUMA, this.VibrantSwatch = new Swatch(Vibrant.hslToRgb(hsl[0], hsl[1], hsl[2]), 0)), void 0 === this.DarkVibrantSwatch && void 0 !== this.VibrantSwatch) return hsl = this.VibrantSwatch.getHsl(), hsl[2] = this.TARGET_DARK_LUMA, this.DarkVibrantSwatch = new Swatch(Vibrant.hslToRgb(hsl[0], hsl[1], hsl[2]), 0), this.DarkVibrantSwatch
        }, Vibrant.prototype.findMaxPopulation = function() {
            var j, len, population, ref, swatch;
            for (population = 0, ref = this._swatches, j = 0, len = ref.length; j < len; j++) swatch = ref[j], population = Math.max(population, swatch.getPopulation());
            return population
        }, Vibrant.prototype.findColorVariation = function(targetLuma, minLuma, maxLuma, targetSaturation, minSaturation, maxSaturation) {
            var j, len, luma, max, maxValue, ref, sat, swatch, value;
            for (max = void 0, maxValue = 0, ref = this._swatches, j = 0, len = ref.length; j < len; j++) swatch = ref[j], sat = swatch.getHsl()[1], luma = swatch.getHsl()[2], sat >= minSaturation && sat <= maxSaturation && luma >= minLuma && luma <= maxLuma && !this.isAlreadySelected(swatch) && (value = this.createComparisonValue(sat, targetSaturation, luma, targetLuma, swatch.getPopulation(), this.HighestPopulation), (void 0 === max || value > maxValue) && (max = swatch, maxValue = value));
            return max
        }, Vibrant.prototype.createComparisonValue = function(saturation, targetSaturation, luma, targetLuma, population, maxPopulation) {
            return this.weightedMean(this.invertDiff(saturation, targetSaturation), this.WEIGHT_SATURATION, this.invertDiff(luma, targetLuma), this.WEIGHT_LUMA, population / maxPopulation, this.WEIGHT_POPULATION)
        }, Vibrant.prototype.invertDiff = function(value, targetValue) {
            return 1 - Math.abs(value - targetValue)
        }, Vibrant.prototype.weightedMean = function() {
            var i, sum, sumWeight, value, values, weight;
            for (values = 1 <= arguments.length ? slice.call(arguments, 0) : [], sum = 0, sumWeight = 0, i = 0; i < values.length;) value = values[i], weight = values[i + 1], sum += value * weight, sumWeight += weight, i += 2;
            return sum / sumWeight
        }, Vibrant.prototype.swatches = function() {
            return {
                Vibrant: this.VibrantSwatch,
                Muted: this.MutedSwatch,
                DarkVibrant: this.DarkVibrantSwatch,
                DarkMuted: this.DarkMutedSwatch,
                LightVibrant: this.LightVibrantSwatch,
                LightMuted: this.LightMuted
            }
        }, Vibrant.prototype.isAlreadySelected = function(swatch) {
            return this.VibrantSwatch === swatch || this.DarkVibrantSwatch === swatch || this.LightVibrantSwatch === swatch || this.MutedSwatch === swatch || this.DarkMutedSwatch === swatch || this.LightMutedSwatch === swatch
        }, Vibrant.rgbToHsl = function(r, g, b) {
            var d, h, l, max, min, s;
            if (r /= 255, g /= 255, b /= 255, max = Math.max(r, g, b), min = Math.min(r, g, b), h = void 0, s = void 0, l = (max + min) / 2, max === min) h = s = 0;
            else {
                switch (d = max - min, s = l > .5 ? d / (2 - max - min) : d / (max + min), max) {
                    case r:
                        h = (g - b) / d + (g < b ? 6 : 0);
                        break;
                    case g:
                        h = (b - r) / d + 2;
                        break;
                    case b:
                        h = (r - g) / d + 4
                }
                h /= 6
            }
            return [h, s, l]
        }, Vibrant.hslToRgb = function(h, s, l) {
            var b, g, hue2rgb, p, q, r;
            return r = void 0, g = void 0, b = void 0, hue2rgb = function(p, q, t) {
                return t < 0 && (t += 1), t > 1 && (t -= 1), t < 1 / 6 ? p + 6 * (q - p) * t : t < .5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p
            }, 0 === s ? r = g = b = l : (q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q, r = hue2rgb(p, q, h + 1 / 3), g = hue2rgb(p, q, h), b = hue2rgb(p, q, h - 1 / 3)), [255 * r, 255 * g, 255 * b]
        }, Vibrant
    }(), window.CanvasImage = CanvasImage = function() {
        function CanvasImage(image) {
            this.canvas = document.createElement("canvas"), this.context = this.canvas.getContext("2d");
            var originalWidth = image.width,
                originalHeight = image.height,
                maxArea = 9e4,
                bitmapArea = originalWidth * originalHeight,
                scaleRatio = 1;
            bitmapArea > maxArea && (scaleRatio = maxArea / bitmapArea), this.width = this.canvas.width = originalWidth * scaleRatio, this.height = this.canvas.height = originalHeight * scaleRatio;
            try {
                this.context.drawImage(image, 0, 0, originalWidth, originalHeight, 0, 0, this.width, this.height)
            } catch (err) {
                console.log("Error in drawImage: " + err)
            }
        }
        return CanvasImage.prototype.getPixelCount = function() {
            return this.width * this.height
        }, CanvasImage.prototype.getImageData = function() {
            return this.context.getImageData(0, 0, this.width, this.height)
        }, CanvasImage.prototype.removeCanvas = function() {
            this.context = null, this.canvas = null
        }, CanvasImage
    }()
});