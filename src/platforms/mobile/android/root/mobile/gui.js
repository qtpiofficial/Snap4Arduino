// Resize blocks and categories
IDE_Morph.prototype.originalInit = IDE_Morph.prototype.init;
IDE_Morph.prototype.init = function (isAutoFill) {
    SyntaxElementMorph.prototype.setScale(1.5);
    this.saveSetting('zoom', 1.5);
    this.originalInit(isAutoFill);
    this.isAnimating = false;
};

IDE_Morph.prototype.createCategories = function () {
    var myself = this;

    if (this.categories) {
        this.categories.destroy();
    }
    this.categories = new Morph();
    this.categories.color = this.groupColor;
    this.categories.silentSetWidth(240 || this.logo.width()); // width is fixed

    function addCategoryButton(category) {
        var labelWidth = 75 * SyntaxElementMorph.prototype.scale,
            colors = [
                myself.frameColor,
                myself.frameColor.darker(50),
                SpriteMorph.prototype.blockColor[category]
            ],
            button;

        button = new ToggleButtonMorph(
                colors,
                myself, // the IDE is the target
                function () {
                    myself.currentCategory = category;
                    myself.categories.children.forEach(function (each) {
                        each.refresh();
                    });
                    myself.refreshPalette(true);
                },
                category[0].toUpperCase().concat(category.slice(1)), // label
                function () {  // query
                    return myself.currentCategory === category;
                },
                null, // env
                null, // hint
                null, // template cache
                labelWidth, // minWidth
                true // has preview
                );

        button.fontSize *= SyntaxElementMorph.prototype.scale;

        button.corner = 8;
        button.padding = 0;
        button.labelShadowOffset = new Point(-1, -1);
        button.labelShadowColor = colors[1];
        button.labelColor = myself.buttonLabelColor;
        button.fixLayout();
        button.refresh();
        myself.categories.add(button);
        return button;
    }

    function fixCategoriesLayout() {
        var buttonWidth = myself.categories.children[0].width(),
            buttonHeight = myself.categories.children[0].height(),
            border = 3,
            rows =  Math.ceil((myself.categories.children.length) / 2),
            xPadding = (myself.categories.width()
                    - border
                    - buttonWidth * 2) / 3,
            yPadding = 2,
            l = myself.categories.left(),
            t = myself.categories.top(),
            i = 0,
            row,
            col;

        myself.categories.children.forEach(function (button) {
            i += 1;
            row = Math.ceil(i / 2);
            col = 2 - (i % 2);
            button.setPosition(new Point(
                l + (col * xPadding + ((col - 1) * buttonWidth)),
                t + (row * yPadding + ((row - 1) * buttonHeight) + border)
                )
            );
        });

        myself.categories.setHeight(
            (rows + 1) * yPadding
            + rows * buttonHeight
            + 2 * border
            );
    }

    SpriteMorph.prototype.categories.forEach(function (cat) {
        if (!contains(['lists'], cat)) {
            addCategoryButton(cat);
        }
    });
    fixCategoriesLayout();
    this.add(this.categories);
};

// Garbage bin
IDE_Morph.prototype.showGarbageBin = function () {
    if (!this.garbageBin) {
        ide.buildGarbageBin();
        ide.garbageBin.drawNew();
    }
    this.palette.showOverlay();
    this.garbageBin.show();
    this.garbageBin.setCenter(this.palette.center());
};

IDE_Morph.prototype.hideGarbageBin = function () {
    this.garbageBin.hide();
    this.palette.hideOverlay();
};

IDE_Morph.prototype.buildGarbageBin = function () {
    var myself = this,
        overlay = new Morph();
    this.garbageBin = new Morph();
    this.garbageBin.setExtent(new Point(60, 75));
    this.garbageBin.setCenter(this.palette.center());
    this.garbageBin.isDraggable = false;
    this.garbageBin.acceptsDrops = false;
    this.garbageBin.color = new Color(125, 112, 85);

    this.garbageBin.drawNew = function () {
        var w = this.width(),
            h = this.height();

        this.image = newCanvas(this.extent());
        var context = this.image.getContext('2d');

        context.fillStyle = this.color.toString();
        context.moveTo(0, 0);
        context.lineTo(w / 5, h);
        context.lineTo(w * 4 / 5, h);
        context.lineTo(w, 0);
        context.lineTo(0, 0);
        context.fill();

        context.strokeStyle = this.color.darker().toString();
        context.moveTo(0, 0);
        context.lineTo(w, 0);
        context.stroke();
        context.moveTo(w / 5, h);
        context.lineTo(w * 4 / 5, h);
        context.stroke();

        for (var i = 0; i < 6; i += 1) {
            context.moveTo(w / 5 * i, 0);
            context.lineTo(w / 5 + (3 * w / 25) * i, h);
            context.stroke();
        }
    };

    overlay.setColor(50, 50, 50);
    overlay.setAlphaScaled(50);
    overlay.setExtent(this.palette.extent());
    overlay.setPosition(this.palette.position());
    this.palette.add(overlay);
    overlay.hide();

    this.palette.showOverlay = function () {
        overlay.show();
    };

    this.palette.hideOverlay = function () {
        overlay.hide();
    };

    this.palette.mouseEnterDragging = function () {
        myself.garbageBin.setColor(new Color(225, 212, 85));
    };

    this.palette.mouseLeave = function () {
        myself.garbageBin.setColor(new Color(125, 112, 85));
    };

    this.palette.add(this.garbageBin);
};

// Resize stage and palette
IDE_Morph.prototype.shrinkStage = function () {
    this.toggleStageSize(true);
};

IDE_Morph.prototype.shrinkPalette = function () {
    this.paletteWidth = 2;
    this.setExtent(world.extent());
};

IDE_Morph.prototype.growPalette = function () {
    this.paletteWidth = 240;
    this.setExtent(world.extent());
};

IDE_Morph.prototype.originalCreateStageHandle = IDE_Morph.prototype.createStageHandle;
IDE_Morph.prototype.createStageHandle = function () {
    this.originalCreateStageHandle();
    this.stageHandle = new Morph();
    this.stageHandle.fixLayout = nop;
    this.stageHandle.drawOn = nop;
};

PaletteHandleMorph.prototype.init = function (target) {
    var ide = target.parentThatIsA(IDE_Morph);
    ide.paletteWidth = 5;
    this.target = target || null;
    this.labelText = localize('Blocks');
    HandleMorph.uber.init.call(this);
    this.color = MorphicPreferences.isFlat ?
        new Color(255, 255, 255, 1) : new Color(55, 55, 55, 1);

    this.isDraggable = false;
    this.noticesTransparentClick = true;
    this.setExtent(new Point(18, 120));
};

PaletteHandleMorph.prototype.fixLayout = function () {
    if (!this.target) {return; }
    var ide = this.target.parentThatIsA(IDE_Morph);

    this.setCenter(ide.palette.center());
    this.setRight(this.target.right() + this.width());

    if (ide) {ide.add(this); } // come to front
};

PaletteHandleMorph.prototype.drawOnCanvas = function (
    aCanvas,
    color,
    shadowColor
) {
    var context = aCanvas.getContext('2d'),
        ide = this.target.parentThatIsA(IDE_Morph);
    this.drawBackground(context, color);
    this.drawLabel(context, color.inverted());
    this.drawOutline(context, ide.color);
};

PaletteHandleMorph.prototype.drawBackground = function (context, color) {
    var w = this.width(),
        h = this.height(),
        c = 5;

    context.fillStyle = color.toString();
    context.beginPath();
    context.moveTo(0, 0);
    context.bezierCurveTo(0, h/3, w, h/6, w, h/3);
    context.lineTo(w, h*2/3);
    context.bezierCurveTo(w, h*5/6, 0, h*2/3, 0, h);

    context.closePath();
    context.fill();
};

PaletteHandleMorph.prototype.drawLabel = function (context, color) {
    context.save();
    context.rotate(Math.PI/2);
    context.font = '12px ' + MorphicPreferences.globalFontFamily;
    context.textAlign = 'center';
    context.fillStyle = color.toString();
    context.fillText(localize('Blocks'), this.height() / 2, -2);
    context.restore();
};

PaletteHandleMorph.prototype.drawOutline = function (context, color) {
    var outlineWidth = MorphicPreferences.isFlat ? 1 : 4,
        w = this.width() - outlineWidth + 1,
        h = this.height(),
        c = 5;

    context.strokeStyle = color.toString();
    context.beginPath();
    context.lineWidth = outlineWidth;
    context.moveTo(0, 0);
    context.bezierCurveTo(0, h/3, w, h/6, w, h/3);
    context.lineTo(w, h*2/3);
    context.bezierCurveTo(w, h*5/6, 0, h*2/3, 0, h);
    context.stroke();
};

PaletteHandleMorph.prototype.mouseClickLeft = function () {
    var world = this.world(),
        ide = this.target.parentThatIsA(IDE_Morph);

    if (!this.target) {
        return null;
    }

    if (ide.paletteWidth < 200) {
        ide.growPalette();
    } else {
        ide.shrinkPalette();
    }
};

PaletteHandleMorph.prototype.mouseDownLeft = PaletteHandleMorph.prototype.mouseClickLeft;

// Cordova file operations

IDE_Morph.prototype.fileImport = function () {
    function readFile (fileEntry) {
        fileEntry.file(
            function (file) {
                var reader = new FileReader();
                reader.onload = function (e) { 
                    var contents = e.target.result;
                    ide.droppedText(contents);
                };
                reader.readAsText(file);
            },
            function (error) {
                alert(error);
            }
        );
    };

    fileChooser.open(function (uri) {
        window.resolveLocalFileSystemURL(uri, readFile); 
    });
};

saveAs = function (contents, fileName, ignoreUntitled) {

    if (!ignoreUntitled && fileName === localize('Untitled') + '.xml') {
        window.prompt('Project Name', '', function (name) { saveAs(contents, name, true); });
    }

    window.resolveLocalFileSystemURL(cordova.file.externalRootDirectory, function (dirEntry) {
        dirEntry.getFile(
            fileName,
            {
                create: true,
                exclusive: false
            },
            function (fileEntry) {
                writeFile(fileEntry, new Blob([contents], { type: 'text/xml' }));
            }
        );
    });

    function writeFile (fileEntry, dataObj) {
        fileEntry.createWriter(function (fileWriter) {
            fileWriter.onerror = function (err) {
                alert(err.toString());
            };
            fileWriter.write(dataObj);
        });
    };
};
