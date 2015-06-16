
// THE SKETCH BOOK CONTAINS ALL THE SKETCH PAGES.

   function SketchBook() {
      this.onbeforeunload = function(e) {
         if (isAudiencePopup())
            removeAudiencePopup();
      }

      this.sketchPage = function() {
         return this.sketchPages[this.page];
      }
      this.setPage = function(page) {
         this.page = page;
         if (this.sketchPages[page] === undefined)
            this.sketchPages[page] = new SketchPage();
         return this.sketchPages[page];
      }
      this.clear = function() {
         this.page = 0;
         this.sketchPages = [new SketchPage()];
      }
      this.clear();
   }

   function computeStandardView() {
      sk().standardView();
      for (var i = 0 ; i < 16 ; i++)
         pointToPixelMatrix.elements[i] = m._m()[i];
   }

   function computeStandardViewInverse() {
      sk().standardViewInverse();
      for (var i = 0 ; i < 16 ; i++)
         pixelToPointMatrix.elements[i] = m._m()[i];
   }

// MOST USER INTERACTION IS MEDIATED BY THE CURRENT SKETCH PAGE.

   function SketchPage() {
      this.altCmdState = 0;
      this.fadeAway = 1;
      this.glyphT = 0;
      this.glyphsPerCol = 12;
      this.iDragged = 0;
      this.isCreatingGroup = false;
      this.isDraggingGlyph = false;
      this.isFocusOnLink = false;
      this.isGlyphable = true;
      this.isOnPanStrip = false;
      this.keyPressed = -1;
      this.multiCopyState = 0;
      this.nnSelected = 0;
      this.paletteColorDragXY = null;
      this.scaleRate = 0;
      this.sketches = [];
      this.zoom = 1;
   }

   SketchPage.prototype = {


///////////////////// EVENT HANDLERS /////////////////////////

      // HANDLE MOUSE DOWN FOR THE SKETCH PAGE.

      mouseDown : function(x, y, z) {

         this.isFocusOnSketch = false;

         if (window._is_after_updateF) {
            isTextMode = false;
            return;
         }

         this.mx = x;
         this.my = y;

         if (this.setPageInfo !== undefined)
            return;

         this.isPressed = true;
         this.isClick = true;
         this.isMouseDownOverBackground = ! isHover();
         this.travel = 0;
         this.xDown = x;
         this.yDown = y;
         this.zDown = z;
         this.x = x;
         this.y = y;
         this.z = z;
         this.panXDown = _g.panX;
         this.panYDown = _g.panY;

         if (this.hintTrace !== undefined) {
            this.hintTrace.push([[x,y]]);
            return;
         }

         linkAtMouseDown = null;
         isSketchDragActionEnabled = false;
         isBgActionEnabled = false;
         if (bgClickCount == 1) {
	    if (linkAtCursor != null) {
	       linkAtMouseDown = linkAtCursor;
	       linkAtMouseDown.mouseDown(x, y);
	    }
            else if (isSketchDragActionEnabled = isHover()) {
               needToStartSketchDragAction = true;
            }
            else {
               isBgActionEnabled = true;
               bgActionDown(x, y);
            }
            return;
         }

         if (isShowingGlyphs) {
            for (var i = 0 ; i < glyphs.length ; i++) {
               var b = this.glyphBounds(i);
               if (x >= b[0] && x < b[2] && y >= b[1] && y < b[3]) {
                  this.isDraggingGlyph = true;
                  this.iDragged = i;
                  return;
               }
            }
         }

         if (paletteColorId >= 0) {
            this.paletteColorDragXY = null;
            return;
         }

         if (isRightHover || x >= width() - margin - _g.panX) {
            isRightGesture = true;
            this.yDown = y;
            return;
         }

         this.isPanViewGesture = false;
         if (this.isOnPanStrip) {
            var b = this.panViewBounds;
            this.isPanViewGesture = x >= b[0] && y >= b[1] && x < b[2] && y < b[3];
         }

         if (isBottomHover || y >= height() - margin - _g.panY) {
            isBottomGesture = true;
            this.xDown = x;
            return;
         }

         if (x >= width() - margin && y >= height() - margin - _g.panY) {
            isTogglingMenuType = true;
            return;
         }

         if (isTextMode) {
            strokes = [[[x,y]]];
            strokesStartTime = time;

            iOut = 0;
            return;
         }

         // BEFORE PROCEEDING, FINISH ANY UNFINISHED SKETCH.

         finishDrawingUnfinishedSketch();

         this.isFocusOnLink = false;
         if (linkAtCursor != null) {
            this.isFocusOnLink = true;
            return;
         }

	 if (arrowNearCursor != null) {
	    this.isFocusOnArrow = true;
	    return;
	 }

         if (this.isCreatingGroup)
            return;

         // IN EVERY CASE, EITHER MOUSE DOWN OVER AN EXISTING SKETCH, OR CREATE A NEW SKETCH.

         this.isFocusOnSketch = true;
         this.isStartingToDrawSimpleSketch = false;

         // SEND MOUSE DOWN/DRAG COMMANDS TO AN EXISTING SKETCH.

         this.isFocusOnGlyphSketch = false;

         if (isk() && sk().isMouseOver) {
            x = sk().unadjustX(x);
            y = sk().unadjustY(y);
            if (sk().sketchProgress == 1) {
               this.isFocusOnGlyphSketch = ! (sk() instanceof SimpleSketch) || sk().isGroup();
               sk().isPressed = true;
               sk().isClick = true;
               sk().travel = 0;
               sk().xDown = x;
               sk().yDown = y;
               sk().x = x;
               sk().y = y;
            }
            if (outPort == -1 || sk() instanceof NumericSketch) {
               m.save();
               computeStandardViewInverse();
	       if (! sk().sketchTextsMouseDown(x, y)) {
                  sk().mouseDown(x, y, z);
                  this.skCallback('onPress', x, y, z);
               }
               m.restore();
            }
         }

         // START TO DRAW A NEW SIMPLE SKETCH.

         else if (this.multiCopyState == 0) {
	    this.isStartingToDrawSimpleSketch = true;

            addSketch(new SimpleSketch());
            sk().sketchProgress = 1;
            sk().sketchState = 'finished';
            x = sk().unadjustX(x);
            y = sk().unadjustY(y);

            m.save();
            computeStandardViewInverse();
            sk().mouseDown(x, y, z);
            m.restore();
         }
      },

      // HANDLE MOUSE DRAG FOR THE SKETCH PAGE.

      mouseDrag : function(x, y, z) {

         if (window._is_after_updateF) {
            return;
         }

         this.mx = x;
         this.my = y;

         var w = width();
         var h = height();

         if (this.setPageInfo !== undefined)
            return;

         var dx = x - this.x;
         var dy = y - this.y;
         this.travel += len(dx, dy);
         this.x = x;
         this.y = y;

         if (this.isDraggingGlyph) {
            return;
         }

         if (this.hintTrace !== undefined) {
            this.hintTrace[this.hintTrace.length-1].push([x,y]);
            return;
         }

	 if (linkAtMouseDown != null) {
	    linkAtMouseDown.mouseDrag(x, y);
	    return;
         }

         if (isSketchDragActionEnabled && this.travel > clickSize()) {
            if (needToStartSketchDragAction) {
               startSketchDragAction(this.xDown, this.yDown);
               needToStartSketchDragAction = false;
            }
            doSketchDragAction(x, y);
            return;
         }

         if (isBgActionEnabled) {
            bgActionDrag(x, y);
            return;
         }

         if (bgClickCount == 1)
            return;

         if (! isTouchDevice && paletteColorId >= 0) {
            var index = findPaletteColorIndex(x, y);
            if (index >= 0)
               paletteColorId = index;
            else
               this.paletteColorDragXY = [x,y];
            return;
         }

         if (x >= width() - margin - _g.panX) {
            isRightHover = true;
         } else {
            isRightHover = false;
         }

         if (this.isPanViewGesture)
            return;

         if (! isVerticalPan) {
            if (isBottomGesture) {
               _g.panX = min(0, _g.panX + x - this.xDown);
               return;
            }

            if (isRightHover && isRightGesture && ! isBottomGesture) {
               // DRAGGING TO QUICK SWITCH PAGES
               pageNumber = floor(y / height() * sketchPages.length);
               if (pageNumber != pageIndex)
                  setPage(pageNumber);
               return;
            }
         }
         else {
            if (isRightGesture) {
               _g.panY = min(0, _g.panY + y - this.yDown);
               return;
            }

            if (isBottomHover && isBottomGesture && ! isRightGesture) {
               // DRAGGING TO QUICK SWITCH PAGES
               pageNumber = floor(x / width() * sketchPages.length);
               if (pageNumber != pageIndex)
                  setPage(pageNumber);
               return;
            }
         }

         if (isTogglingMenuType)
            return;

         if (outPort >= 0 && isDef(outSketch.defaultValue[outPort]) && ! this.click) {
            if (isNumeric(outSketch.defaultValue[outPort])) {
               if (this.portValueDragMode === undefined)
                  this.portValueDragMode = abs(x-this.xDown) > abs(y-this.yDown) ? "portValueDragX" : "portValueDragY";
               if (this.portValueDragMode == "portValueDragY") {
                  var incr = floor((y-dy)/10) - floor(y/10);
                  outSketch.defaultValue[outPort] += incr * outSketch.defaultValueIncr[outPort];
               }
            }
            return;
         }

         if (isTextMode) {
            strokes[0].push([x, y]);
            return;
         }

         if (this.isFocusOnLink) {
            if (linkAtCursor != null)
               linkAtCursor.computeCurvature([x,y]);
            return;
         }

         if (this.isFocusOnArrow) {
            if (arrowNearCursor != null) {
	       var n = arrowNearCursor.n;
	       var a = arrowNearCursor.s;
	       var b = a.arrows[n][1];
	       a.arrows[n][0] = computeCurvature([a.cx(),a.cy()], [x,y], [b.cx(),b.cy()]);
            }
            return;
         }

         if (this.isCreatingGroup)
            return;

         // SEND DRAG EVENT TO THE SKETCH THAT HAS FOCUS, IF ANY.

         if (isk() && this.isFocusOnSketch && this.multiCopyState == 0) {
            x = sk().unadjustX(x);
            y = sk().unadjustY(y);
            if (sk().sketchProgress == 1) {
               sk().travel += len(x - sk().x, y - sk().y);
               if (sk().travel > clickSize())
                  sk().isClick = false;
               sk().x = x;
               sk().y = y;
            }
            if (outPort == -1 || sk() instanceof NumericSketch) {

               m.save();
               computeStandardViewInverse();
	       if (! sk().sketchTextsMouseDrag(x, y)) {
                  sk().mouseDrag(x, y, z);
                  this.skCallback('onDrag', x, y, z);
               }
               m.restore();

            }
         }
      },

      // HANDLE MOUSE UP FOR THE SKETCH PAGE.

      mouseUp : function(x, y, z) {

         if (window._is_after_updateF) {
            window._is_after_updateF = undefined;
            return;
         }

         if (this.setPageInfo !== undefined) {
            setPage(this.setPageInfo.page);
            delete this.setPageInfo;
            return;
         }

         this.isPressed = false;

         if (this.hintTrace !== undefined)
            return;

         if (linkAtMouseDown != null) {
	    linkAtMouseDown.mouseUp(x, y);
	    bgClickCount = 0;
	    return;
	 }

         if (this.portValueDragMode !== undefined) {
            if (this.portValueDragMode == "portValueDragX") {
               outSketch.defaultValue[outPort] *= x > this.xDown ? 0.1 : 10;
               outSketch.defaultValueIncr[outPort] *= x > this.xDown ? 0.1 : 10;
            }
            delete this.portValueDragMode;
            return;
         }

         if (this.isDraggingGlyph) {
            glyphs[this.iDragged].toSimpleSketch(This().mouseX, This().mouseY, 1.5);
            this.isDraggingGlyph = false;
            return;
         }

         if (isSketchDragActionEnabled && this.travel > clickSize()) {
            endSketchDragAction(x, y);
            bgClickCount = 0;
            isSketchDragActionEnabled = false;
         }

         if (isBgActionEnabled) {
            bgActionUp(x, y);
            bgClickCount = 0;
	    isBgActionEnabled = false;
            return;
         }

         if (paletteColorId >= 0) {

            // MOUSE-UP OVER PALETTE TO SET THE DRAWING COLOR.

            if (this.paletteColorDragXY == null)
               this.colorId = paletteColorId;

            // DRAG A COLOR SWATCH FROM THE PALETTE TO CHANGE COLOR OF A SKETCH.

            else {
               if (isk() && sk().isMouseOver) {
                  sk().setColorId(paletteColorId);
                  if (sk() instanceof GeometrySketch)
                     sk().mesh.setMaterialToRGB(paletteRGB[sk().colorId]);
                  else if (sk()._gl !== undefined)
		     sk().renderStrokeSetColor();
               }
               this.paletteColorDragXY = null;
            }
            return;
         }

         if (! isVerticalPan) {
            if (isBottomGesture) {
               if (abs(_g.panX - this.panXDown) <= clickSize() && y < height() - 100)
                  this.clear();
               isBottomGesture = false;
               return;
            }

            if (isRightHover && isRightGesture) {

               // CLICK TO SWITCH PAGES QUICKLY.

               pageNumber = floor(y / height() * sketchPages.length);
               if (pageNumber != pageIndex)
                  setPage(pageNumber);
               return;
            }
         }
         else {
            if (isRightGesture) {
               if (abs(_g.panY - this.panYDown) <= clickSize() && x < width() - 100)
                  this.clear();
               isRightGesture = false;
               return;
            }

            if (isBottomHover && isBottomGesture) {

               // CLICK TO SWITCH PAGES QUICKLY.

               pageNumber = floor(x / width() * sketchPages.length);
               if (pageNumber != pageIndex)
                  setPage(pageNumber);
               return;
            }
         }

         isRightGesture = false;
         isBottomGesture = false;

         if (isTogglingMenuType) {
            isTogglingMenuType = false;
            menuType = (menuType + 1) % 2;
            return;
         }

         if (this.travel > clickSize())
            this.isClick = false;

         // HANDLE MULTIPLE COPIES.

         if (this.multiCopyState > 0) {
	    if (this.isClick) {
               copySketch(this.multiCopySource);
               sk().tX = x;
               sk().tY = y;
               if (! sk().isSimple()) {
                  sk().tX -= width() / 2;
                  sk().tY -= height() / 2;
               }
            }
            else if (this.multiCopyState++ == 2)
              this.multiCopyState = 0;
            return;
	 }

         // SPECIAL HANDLING FOR TEXT MODE.

         if (isTextMode) {

	    // HANDLE CLICK IN TEXT MODE.

            if (this.isClick) {

               // CLICK ON STROKE SETS THE TEXT CURSOR.

               if (isHover())
                  sk().setTextCursor(sk().unadjustX(x), sk().unadjustY(y));

               // CLICK NOT ON STROKE TURNS OFF TEXT MODE.

               else
                  toggleTextMode();
            }

            else {

               var glyph = findGlyph(strokes, glyphs);

	       if (glyph != null && ! isCreatingGlyphData) {

	          // IF A NUMBER SKETCH WAS FOUND, TREAT IT AS A DIGIT CHARACTER.

	          var name = glyph.name;
	          if (glyph.name.indexOf('number_sketch') >= 0)
		     name = name.replace(/[^0-9]/g,'');

                  this.handleDrawnTextChar(name);
               }
            }

            strokes = [];
            return;
         }

         if (this.isFocusOnLink && bgClickCount != 1) {

            // CLICK ON A LINK TO DELETE IT.

            if (this.isClick)
               deleteLinkAtCursor();

            // DRAGGING A LINK TO A SKETCH THAT HAS AN OPEN CODE EDITOR WINDOW
            // CAUSES ALL INSTANCES OF THAT VARIABLE TO BE REPLACED BY ITS VALUE.

            else if (isCodeWidget && codeSketch.contains(x, y)) {
               var j = linkAtCursor.j;
               codeTextArea.value = variableToValue(codeTextArea.value,
                                                    "xyz".substring(j, j+1),
                                                    roundedString(codeSketch.inValue[j]));
               deleteLinkAtCursor();
            }
            return;
         }

	 // CLICK ON AN ARROW TO DELETE IT.

         if (this.isClick && arrowNearCursor != null && bgClickCount != 1) {
	    var s = arrowNearCursor.s;
	    var n = arrowNearCursor.n;
	    s.arrows[n][2] = 0.9;
	    return;
	 }

         // CLICK AFTER DRAWING A GROUP-DEFINING PATH CREATES A NEW GROUP.

         if (this.isCreatingGroup) {
            this.isCreatingGroup = false;
            this.toggleGroup();
            return;
         }

         // CLICKING ON A SKETCH.

         if (this.isClick && isHover()) {

	    // CLICK ON A GROUP TO UNGROUP IT.

            if (bgClickCount == 0 && sk().isGroup()) {
	       this.toggleGroup();
	       return;
	    }

            // CLICK ON A CODE SKETCH TO BRING UP ITS CODE.

            if (bgClickCount == 0 && sk().onClick === undefined && sk().code != null) {
               if (isCodeWidget && codeSketch != sk())
                  toggleCodeWidget();
               codeSketch = sk();
               toggleCodeWidget();
               return;
            }

            // CLICK ON A SKETCH AFTER CLICKING ON BACKGROUND TO DO A SKETCH ACTION.

            else if (doSketchClickAction(sk().unadjustX(x), sk().unadjustY(y)))
               return;
         }

	 // IF WE JUST CLICKED, THEN WE ARE NOT REALLY STARTING TO DRAW A SIMPLE SKETCH.

	 if (this.isStartingToDrawSimpleSketch && this.isClick)
	    this.isFocusOnSketch = false;

         // SEND UP EVENT TO THE SKETCH THAT HAS FOCUS, IF ANY.

         if (isk() && this.isFocusOnSketch) {

            x = sk().unadjustX(x);
            y = sk().unadjustY(y);

            if (sk().sketchProgress == 1)
               sk().isPressed = false;
            sk().isDrawingEnabled = true;

            if (outPort == -1 || sk() instanceof NumericSketch) {
               m.save();
               computeStandardViewInverse();
	       if (! sk().sketchTextsMouseUp(x, y)) {
                  sk().mouseUp(x, y, z);
                  this.skCallback('onRelease', x, y, z);
               }
               m.restore();
            }

            if (this.isClick && isHover() && isDef(sk().onClick)) {
               m.save();
               computeStandardViewInverse();
               this.skCallback('onClick', x, y, 0);
               m.restore();
               return;
            }

            if (! this.isClick && isk() && isDef(sk().onSwipe)) {

               m.save();
               computeStandardViewInverse();
	       var dx = x - this.xDown;
	       var dy = y - this.yDown;
               sk().onSwipe(dx, dy);
               m.restore();

               return;
            }
         }

         // DETECT A CLICK OVER BACKGROUND

         if (this.isClick && this.isMouseDownOverBackground) {
	    deleteSketch(sk());
	    bgClickCount++;
            bgClickX = x;
            bgClickY = y;
         }
      },

      // HANDLE MOUSE MOVE FOR THE SKETCH PAGE.

      mouseMove : function(x, y, z) {

         if (this.setPageInfo !== undefined) {
            if (len(x - this.setPageInfo.x, y - this.setPageInfo.y) > clickSize())
               delete this.setPageInfo;
         }

         this.x = x;
         this.y = y;

         //if (x >= width() - margin - _g.panX && y < height() - margin) {
         if (x >= width() - margin - _g.panX) {
            isRightHover = true;
         } else {
            isRightHover = false;
         }

         //if (y >= height() - margin - _g.panY && x < width() - margin) {
         if (! isRightHover && y >= height() - margin - _g.panY) {
            isBottomHover = true;
         } else {
            isBottomHover = false;
         }

         if (isFakeMouseDown) {
            this.mouseDrag(x, y, z);
            return;
         }

         // IF IN SKETCH-ACTION MODE, MOVING MOUSE DOES THE SKETCH ACTION.

         if (sketchAction != null) {
            switch (sketchAction) {
            case "translating": this.doTranslate(x, y); break;
            case "rotating"   : this.doRotate(x, y); break;
            case "scaling"    : this.doScale(x, y); break;
            case "undrawing"  : this.doUndraw(x, y); break;
            }

            this.mx = x;
            this.my = y;
            bgClickCount = 0;
            return;
         }

         // SPECIAL HANDLING OF MOUSE MOVE IF VARIOUS KEYS ARE PRESSED.

         switch (letterPressed) {
         case 'spc':
            break;
         case 'b':
            if (sk().isGroup()) {

               var p0 = [];
               for (var i = 0 ; i < sk().children.length ; i++)
                  p0[i] = computeCentroid(sk(), sk().children[i], sk().groupPath);

               bendCurve(sk().groupPath, [x,y], sk().groupPathLen * sk().sc);

               for (var i = 0 ; i < sk().children.length ; i++) {
                  var s = sk().children[i];
                  var p1 = computeCentroid(sk(), s, sk().groupPath);
                  var dx = p1[0] - p0[i][0];
                  var dy = p1[1] - p0[i][1];
                  s.translate(dx, dy);
                  s.xlo += dx;
                  s.ylo += dy;
                  s.xhi += dx;
                  s.yhi += dy;
               }

               sk().computeGroupBounds();
            }
            else
               bendCurve(sk().sp0, sk().m2s([x,y]), sk().len, 1);
            break;
         case 'g':
            this.groupDragPath(x, y);
            break;
         case 'r':
            this.doRotate(x, y);
            break;
         case 's':
            isManualScaling = true;
            this.doScale(x, y);
            break;
         case 't':
            this.doTranslate(x, y);
            break;
         case 'u':
            this.doUndraw(x, y);
            break;
         case 'z':
            this.doZoom(x, y);
            break;

         // HANDLING FOR MOUSE MOVE IF NO KEY IS PRESSED.

         default:

            // IF IN GROUP-CREATE MODE, EXTEND THE GROUP PATH.

            if (this.isCreatingGroup)
               this.groupDragPath(x, y);

            // OTHERWISE IF CURRENT SKETCH IS FINISHED, SEND EVENT TO THE SKETCH.

            else if (isk() && sk().sketchState == 'finished') {
               findOutSketchAndPort();

               m.save();
               computeStandardViewInverse();
               sk().mouseMove(x, y, z);
               this.skCallback('onMove', x, y, z);
               m.restore();

            }
            break;
         }

         this.mx = x;
         this.my = y;
         this.mz = z;

         // WHEN MOUSE MOVES OVER THE COLOR PALETTE, SET THE PALETTE COLOR.

         if (! isTouchDevice)
            paletteColorId = findPaletteColorIndex(x, y);
      },

      keyDown : function(key) {

         // Ignore multiple presses of the same key

         if (key == this.keyPressed)
            return;
         this.keyPressed = key;

         // Catch ALT-CMD-key escape, because it won't trigger
         // any keyUp to reset letterPressed to '\0'.

         if (key == 18) this.altCmdState |= 1;
         else if (key == 91) this.altCmdState |= 2;
         else if (this.altCmdState == 3) {
            this.altCmdState = 0;
            letterPressed = '\0';
            return;
         }

         var letter = charCodeToString(key);
         letterPressed = letter;

         if (outPort >= 0 && isDef(outSketch.defaultValue[outPort])) {
            isTextMode = true;
            this.isPortValueTextMode = true;
         }

         if (isTextMode) {
            switch (letter) {
            case 'alt':
               isAltPressed = true;
	       break;
            case 'command':
               isCommandPressed = true;
	       break;
            case 'control':
               isControlPressed = true;
	       break;
            case 'cap':
               isShiftPressed = true;
               break;
            }
            return;
         }

	 if (isShowingGlyphs && key >= 48 && key <= 48 + 9) {
	    this.nnSelected |= 1 << key - 48;
	    return;
	 }

         switch (letter) {
         case 'alt':
            isAltPressed = true;
            return;
         case 'command':
            isCommandPressed = true;
            return;
         case 'control':
            isControlPressed = true;
            return;
         case 'cap':
            isShiftPressed = true;
            return;
         case 'spc':
            isSpacePressed = true;
            return;
         case 'p':
            isPanning = true;
            break;
         default:
	    if (isk())
	      sk().keyDown(letter);
            break;
         }
      },

      keyUp : function(key) {

         // Part of logic to account for multiple presses of the same key.

         this.keyPressed = -1;

         // Convert key to the proper letter encoding.

         letterPressed = '\0';
         var letter = charCodeToString(key);

         if (isCommandPressed && key == 91) {
            isCommandPressed = false;
            return;
         }

	 if (isShowingGlyphs && key >= 48 && key <= 48 + 9) {
	    this.nnSelected ^= 1 << key - 48;
	    return;
	 }

	 // USE DIGIT KEY TO SIMULATE SWIPE.

	 if (! isTextMode && isk() && isHover() && key >= 48 && key <= 48 + 9) {
	    if (sk().onSwipe !== undefined) {
	       var r = 2 * clickSize();
	       var theta = TAU * (key - 48) / 8;
               var dx =  r * cos(theta);
               var dy = -r * sin(theta);
	       sk().onSwipe(dx, dy);
	       return;
	    }
	 }

         // Special handling for when in text mode.

         if (isTextMode) {
	    switch (letter) {
	    case 'alt':
	    case 'command':
	    case 'control':
	      break;
            default:
               if (this.isPortValueTextMode !== undefined) {
                  var val = "" + outSketch.defaultValue[outPort];
                  if (letter == 'del') {
                     if (val.length > 0) {
                        val = val.substring(0, val.length-1);
                        if (isNumeric(val))
                           val = parseFloat(val);
                     }
                  }
                  else if (isNumeric(val) && isNumeric(letter))
                     val = parseFloat(val) + parseFloat(letter);
                  else
                     val += letter;
                  outSketch.defaultValue[outPort] = isNumeric(val) ? val : val.length == 0 ? 0 : val;
               }
               else {
                  this.handleTextChar(letter);
               }
               return;
	    }
         }

         for (var i = 0 ; i < sketchTypes.length ; i++)
            if (letter == sketchTypes[i].substring(0, 1)) {
               addSketchOfType(i);
               sk().setSelection(0);
               return;
            }

         switch (letter) {
         case '!':
            this.clear();
            break;
         case '#':
            this.toggleLinedBackground();
            break;
         case 'smaller':
	    _font_scale_factor /= 1.1;
	    break;
         case 'larger':
	    _font_scale_factor *= 1.1;
	    break;
         case 'P':
         case PAGE_UP:
         case PAGE_DN:
            var handle = window[_g.canvas.id];
	    if (isWand) {
	       if (window._wandPixel === undefined)
	          _wandPixel = newVec3();
               _wandPixel.set(wand.x, wand.y, wand.z).applyMatrix4(pointToPixelMatrix);
	       mouseMoveEvent.clientX = _wandPixel.x;
	       mouseMoveEvent.clientY = _wandPixel.y;
	       mouseMoveEvent.clientZ = _wandPixel.z;
	    }
            if (! isFakeMouseDown) {
               handle.mouseX = mouseMoveEvent.clientX;
               handle.mouseY = mouseMoveEvent.clientY;
               handle.mouseZ = mouseMoveEvent.clientZ;

               handle.mousePressedAtX = handle.mouseX;
               handle.mousePressedAtY = handle.mouseY;
               handle.mousePressedAtZ = handle.mouseZ;

               handle.mousePressedAtTime = time;
               handle.mousePressed = true;
	       if (isDef(handle.mouseDown))
                  handle.mouseDown(handle.mouseX, handle.mouseY, handle.mouseZ);
            }
            else {
               if (sketchAction != null)
                  sketchAction = null;
               else {
                  handle.mouseX = mouseMoveEvent.clientX;
                  handle.mouseY = mouseMoveEvent.clientY;
                  handle.mouseZ = mouseMoveEvent.clientZ;

                  handle.mousePressed = false;
	          if (isDef(handle.mouseUp))
                     handle.mouseUp(handle.mouseX, handle.mouseY, handle.mouseZ);
               }
            }
            isFakeMouseDown = ! isFakeMouseDown;
            break;
         case L_ARROW:
            if (isk())
               sk().offsetSelection(-1);
            break;
         case U_ARROW:
            setPage(pageIndex - 1);
            break;
         case R_ARROW:
            if (isk())
               sk().offsetSelection(1);
            break;
         case D_ARROW:
            setPage(pageIndex + 1);
            break;
         case 'esc':
	    if (isCodeWidget)
	       toggleCodeWidget();
            break;
         case 'del':
            if (isk())
               if (isShiftPressed)
                  sk().removeLastStroke();
               else {
                  sketchAction = null;
                  sk().fadeAway = 1.0;
                  fadeArrowsIntoSketch(sk());
                  setTextMode(false);
               }
               else
                  setTextMode(false);
            break;
         case 'spc':
            isSpacePressed = false;
            break;
         case 'alt':
            if (isAltKeyCopySketchEnabled)
               copySketch(sk());
            isAltPressed = false;
            break;
         case 'command':
            isCommandPressed = false;
            break;
         case 'control':
            isControlPressed = false;
            break;
         case 'cap':
            isShiftPressed = false;
            break;
         case '=':
         case '+':
            isShowingGlyphs = ! isShowingGlyphs;
            break;
         case '?':
            isShowingNLParse = ! isShowingNLParse;
            break;
         case 'a':
            isShowingPresenterView = false;
            if (! isAudiencePopup())
               createAudiencePopup();
            else
               removeAudiencePopup();
            break;
         case 'B':
	    if (window.socket === undefined)
	       window.socket = server.connectSocket();
	    server.onBroadcast = function(event) {
	       console.log("message received: " + event.data);
            };
	    server.broadcastEvent("hi mom!");
	    break;
         case 'c':
            if (isk())
               sk().isCard = ! sk().isCard;
            break;
         case 'C':
	    this.hideCursor = this.hideCursor === undefined ? true : undefined;
            break;
         case 'd':
            showingLiveDataMode = (showingLiveDataMode + 1) % 3;
            break;
         case 'e':
            toggleCodeWidget();
            break;
         case 'F':
	    isFog = ! isFog;
	    backgroundColor = isFog ? 'rgb(24,43,62)' : 'black';
            background.style.backgroundColor = backgroundColor;
	    break;
         case 'f':
	    if (isk())
	       this.bringToFront(sk());
            break;
         case 'T':
	    defaultFont = defaultFont == 'Arial' ? 'hand2-Medium' : 'Arial';
	    break;
         case 'g':
            this.toggleGroup();
            break;
         case 'h':
            if (this.hintTrace === undefined)
               this.hintTrace = [];
            else
               delete this.hintTrace;
            break;
         case 'i':
            toggleTextMode();
            break;
         case 'j':
	    if (isk() && sk() instanceof SimpleSketch)
	       sk().joinNextStroke = true;
            break;
         case 'J':
	    server.set("state/sketchpage", this.sketches);
            break;
         case 'K':
	    server.get("state/sketchpage", function(val) {
	       var sketches = JSON.parse(val);
	       for (var i = 0 ; i < sketches.length ; i++) {
	          var sketch = sketches[i];
	          sg(sketch.typeName, sketch.selection);
	          for (var prop in sketch)
	             sk()[prop] = sketch[prop];
               }
	    });
            break;
         case 'k':
            if (isk() && sk() instanceof GeometrySketch) {
               var type = sk().glyph.indexName;
               var name = type + "_s";

               // CREATE AN OUTLINE DRAWING FOR THIS 3D OBJECT.

               var strokes = sk().mesh.toStrokes();

               // COMPUTE PIXEL COORDS OF MATRIX ORIGIN.

               var m = sk().mesh.matrixWorld.elements;
               var x0 = width()/2 + pixelsPerUnit * m[12];
               var y0 = height()/2 - pixelsPerUnit * m[13];

               // COMPUTE THE PIXEL WIDTH.

               var xlo = 10000, xhi = -xlo;
               for (var i = 1 ; i < sk().sp0.length ; i++) {
                  xlo = min(xlo, sk().sp0[i][0]);
                  xhi = max(xhi, sk().sp0[i][0]);
               }

               registerGlyph("sg('StrokesSketch','" + name + "')", strokes, name);
               var index = glyphIndex(glyphs, name);
               glyphs[index].info = { type: type, x0: x0, y0: y0, rX: sk().rX, rY: sk().rY, sw: xhi - xlo };
            }
            break;
         case 'l':
            isShowingMeshEdges = ! isShowingMeshEdges;
            break;
         case 'm':
            menuType = (menuType + 1) % 2;
            break;
         case 'n':
            if (isk())
               sk().isNegated = ! sk().isNegated;
            break;
         case 'o':
            isCreatingGlyphData = ! isCreatingGlyphData;
            break;
         case 'p':
            isPanning = false;
            break;
         case 'q':
            _g.query = 0;
            break;
         case 'b':
         case 'r':
         case 't':
            break;
         case 's':
            sketchAction = null;
            isManualScaling = false;
            break;
         case 'w':
            this.isWhiteboard = ! this.isWhiteboard;
            break;
         case 'W':
	    if (this.wandEmulation === undefined)
	       this.wandEmulation = newVec3();
            else
	       this.wandEmulation = undefined;
	    break;
         case 'x':
            isExpertMode = ! isExpertMode;
            break;
         case 'X':
	    if (isk()) {
	       if (sk().graph !== undefined)
	          sk().isXMLGraph = sk().isXML === undefined ? true : undefined;
            }
	    else
	       xmlWriteEnabled = ! xmlWriteEnabled;
	    break;
         case 'z':
            break;
         case '/':
            isVerticalPan = ! isVerticalPan;
            break;
         case '-':
            this.toggleColorScheme();
            break;
         case '\\':
            isVerticalPan = ! isVerticalPan;
            this.toggleColorScheme();
            this.toggleLinedBackground();
            break;
         case '^':
            if (videoLayer !== null)
               videoLayer.Scale_X = 3.1 - videoLayer.Scale_X;
            break;
         case 'v':
            if (videoLayer == null) {
               // INIT VIDEO LAYER
               videoLayer = new ChromaKeyedVideo();
               videoLayer.init(video_canvas);
            }
            else {
               videoLayer.toggle();
            }
            break;
         case 'V':
            videoLayer.toggleControls();
            break;
         case 'Z':
	    this.toggleShowScript();
            break;
         default:
	    if (isk())
	       sk().keyUp(letter);
	    break;
         }
      },

//////////////////////////////////////////////////////////////


      bringToFront : function(s) {
         for (var i = 0 ; i < this.sketches.length ; i++)
	    if (this.sketches[i] == s) {
	       this.sketches.splice(i, 1);
	       break;
	    }
         this.sketches.push(s);
      },

      clear : function() {
         this.fadeAway = 1;
      },

      doFadeAway : function(elapsed) {
         this.fadeAway = max(0.0, this.fadeAway - elapsed / 0.25);
         _g.globalAlpha = this.fadeAway;
         if (this.fadeAway == 0.0) {
            this.clearAfterFadeAway();
            _g.sketchProgress = 1;
            _g.suppressSketching = 0;
            _g.xp0 = _g.yp0 = _g.xp1 = _g.yp1 = 0;
            _g.globalAlpha = 1.0;
         }
      },

      beginTextSketch : function() {
         this.keyDown(64 + 9);            // enter text insertion mode
         this.keyUp(64 + 9);
         return sk();
      },

      addTextToTextSketch : function(text) {
         for (var i = 0 ; i < text.length ; i++) {
            var charCode = text.charCodeAt(i);
            this.keyDown(charCode);
            this.keyUp(charCode);
         }
         return sk();
      },

      createTextSketch : function(text) {
         this.beginTextSketch();
         this.addTextToTextSketch(text);
         setTextMode(false);
         return sk();
      },

      createLink : function() {

         // AVOID CREATING DUPLICATE LINKS.

         if (inPort >= inSketch.in.length || inSketch.in[inPort] === undefined
                                          || inSketch.in[inPort].a != outSketch
                                          || inSketch.in[inPort].i != outPort )

            new SketchLink(outSketch, outPort, inSketch, inPort);
      },

      clearAfterFadeAway : function() {
         if (isCodeWidget)
            toggleCodeWidget();

         this.colorId = 0;
         this.index = -1;
         while (this.sketches.length > 0)
            deleteSketch(this.sketches[0]);
         isShowingNLParse = false;

         if (renderer != null && isDef(renderer.scene)) {
            var root = renderer.scene.root;
            if (isDef(root))
               for (var i = root.children.length ; i > 0 ; i--)
                  root.remove(i);
         }
      },

      findIndex : function(sketch) {
         for (var i = 0 ; i < this.sketches.length ; i++)
            if (this.sketches[i] == sketch)
               return i;
         return -1;
      },

      add : function(sketch) {
         this.sketches.push(sketch);
         this.index = this.sketches.length - 1;
         sketch.index = this.index;
      },

      getSketchesByLabel : function(label) {
         var sketches = [];
         for (var i = 0 ; i < this.sketches.length ; i++)
            if (label == this.sketches[i].labels[this.sketches[i].selection])
                  sketches.push(this.sketches[i]);
         return sketches;
      },


      skCallback : function(action, x, y, z) {
         if (isk() && sk()[action] !== undefined) {
            if (sk()._cursorPoint === undefined)
               sk()._cursorPoint = newVec3();
            if (x === undefined)
	       sk()._cursorPoint.set(wand.x,wand.y,wand.z);
            else {
               if (z === undefined) z = 0;
               sk()._cursorPoint.set(x,y,z).applyMatrix4(pixelToPointMatrix);
            }
            sk()[action](sk()._cursorPoint);
         }
      },

      handleDrawnTextChar : function(textChar) {
         if (textChar.length > 0 && textChar.indexOf('(') > 0) {
            if (textChar == 'kbd()')
               kbd();
            return;
         }

         switch (textChar) {
         case 'cap':
            isShiftPressed = ! isShiftPressed;
            break;
         case null:
            break;
         default:
            this.handleTextChar(shift(textChar));
            break;
         }
      },

      // ROTATE CURRENT SKETCH.

      doRotate : function(x, y) {
         if (isk()) {
            sk().rX += 2 * (x - this.mx) /  width();
            sk().rY += 2 * (y - this.my) / -height();
         }
      },

      // SCALE CURRENT SKETCH.

      doScale : function(x, y) {
         if (isk())
            sk().scale(pow(16, (y - this.my) / -height()));
      },

      // TRANSLATE CURRENT SKETCH.

      doTranslate : function(x, y) {
         if (isk()) {
            if (sk().hasMotionPath()) {
               var X = sk().motionPath[0];
               var Y = sk().motionPath[1];
               var x0 = X[0];
               var y0 = Y[0];

               var curve = [], totalLength = 0;
               for (var i = 0 ; i < X.length ; i++) {
                  curve.push([X[i] - x0,Y[i] - y0]);
                  if (i > 0)
                     totalLength += len(X[i]-X[i-1],Y[i],Y[i-1]);
               }

               bendCurve(curve, [x - sk().tX, y - sk().tY], totalLength);

               X = [];
               Y = [];
               for (var i = 0 ; i < curve.length ; i++) {
                  X.push(curve[i][0] + x0);
                  Y.push(curve[i][1] + y0);
               }
               sk().motionPath = [X, Y];

               return;
            }
            sk().translate(sk().unadjustD(x - this.mx), sk().unadjustD(y - this.my));
            if (isSketchInProgress()) {
               cursorX += x - this.mx;
               cursorY += y - this.my;
               sk().sp[0] = [sk().xStart = cursorX, sk().yStart = cursorY, 0];
            }
            var sketches = sk().intersectingSketches();
            for (var i = 0 ; i < sketches.length ; i++) {
               if (isDef(sk().onIntersect))
                  sk().onIntersect(sketches[i]);
               if (isDef(sketches[i].onIntersect))
                  sketches[i].onIntersect(sk());
            }
         }
      },

      // TEMPORARILY UNDRAW CURRENT SKETCH.

      doUndraw : function(x, y) {
         if (isk() && sk() instanceof SimpleSketch) {
            this.tUndraw = max(0, min(1, (x - this.xDown) / 200));
         }
      },

      // ZOOM THE SKETCH PAGE

      doZoom : function(x, y) {
         this.zoom *= 1 - (y - this.my) / height();
      },

      // RESPONSE TO MOUSE MOVE WHILE IN CREATING GROUP PATH MODE.

      groupDragPath : function(x, y, z) {
         for (var I = 0 ; I < nsk() ; I++)
            if (sk(I).parent == null && sk(I).contains(this.mx, this.my))
               groupSketches[I] = true;
         if (isk()) {
            m.save();
            computeStandardViewInverse();
            sk().mouseMove(x, y, z);
            this.skCallback('onMove', x, y, z);
            m.restore();
         }
         groupPath.push([x,y]);
      },

      // UNPACK GROUP IF THERE IS ONE.  ELSE CREATE A NEW GROUP.

      toggleGroup : function() {

         // FOUND A GROUP: UNPACK IT.

         if (Object.keys(groupSketches).length == 0) {
            if (isHover() && sk().isGroup()) {
               for (var i = 0 ; i < sk().children.length ; i++)
                  sk().children[i].parent = null;
               sk().children = [];
               deleteSketch(sk());
            }
            return;
         }

         // OTHERWISE A NEW GROUP IS CREATED.

         addSketch(new SimpleSketch());
         sk().sketchProgress = 1;
         sk().sketchState = 'finished';
         for (var j in groupSketches)
            sk().children.push(sk(j));
         sk().computeGroupBounds();
         sk().groupPath = cloneArray(groupPath);
         sk().groupPathLen = computeCurveLength(groupPath);
         sk().labels = "ungroup".split(' ');
         groupSketches = {};
         groupPath = [];
      },

      handleTextChar : function(letter) {
         switch (letter) {
         case 'control': if (isk()) sk().insertText(CONTROL); break;
         case 'alt'    : if (isk()) sk().insertText(ALT    ); break;
         case 'command': if (isk()) sk().insertText(COMMAND); break;
         case L_ARROW:
            if (isk()) sk().moveCursor(-1);
            break;
         case R_ARROW:
            if (isk()) sk().moveCursor(+1);
            break;
         case U_ARROW:
            if (isk()) sk().moveLine(-1);
            break;
         case D_ARROW:
            if (isk()) sk().moveLine(+1);
            break;
         case 'command':
            isCommandPressed = false;
            break;
         case 'control':
            isControlPressed = false;
            break;
         case 'shift':
            isShiftPressed = ! isShiftPressed;
            break;
         case 'cap':
            isShiftPressed = false;
            break;
         case 'esc':
            setTextMode(false);
            break;
         case '\b':
         case 'del':
            if (isk()) sk().deleteChar();
            break;
         default:
            switch (letter) {
            case 'spc':
               letter = ' ';
               break;
            case 'ret':
               letter = '\n';
               break;
            }
            if (isk()) sk().insertText(letter);
         break;
         }
      },

      toggleShowScript : function() {
         if (isk() && isDef(sk().typeName)) {
            if (! isDef(sk().isShowingScript)) {
               sk().isShowingScript = true;
               codeSketch = sk();
            }
            toggleCodeWidget();
	    return true;
         }
	 return false;
      },

      toggleLinedBackground : function() {
         if (this.isLinedPaper === undefined)
            this.isLinedPaper = true;
         else
            delete this.isLinedPaper;
      },

      toggleColorScheme : function() {
         if (backgroundColor === 'white') {
            backgroundColor = 'black';
            defaultPenColor = 'white';
            paletteRGB[0][0] =
            paletteRGB[0][1] =
            paletteRGB[0][2] = 255;
            palette[0] = 'rgb(255,255,255)';
         }
         else {
            backgroundColor = 'white';
            defaultPenColor = 'black';
            paletteRGB[0][0] =
            paletteRGB[0][1] =
            paletteRGB[0][2] = 0;
            palette[0] = 'rgb(0,0,0)';
         }
	 bodyElement.style.color = defaultPenColor;

         document.getElementsByTagName('body')[0].style.backgroundColor = backgroundColor;

         background.color = backgroundColor;
         background.style.backgroundColor = backgroundColor;
         palette[0] = defaultPenColor;
         for (var i = 0 ; i < this.sketches.length ; i++)
            if (this.sketches[i].colorId == 0)
               this.sketches[i].setColorId(0);

         if (codeTextArea != null) {
            codeTextArea.style.backgroundColor = codeTextBgColor();
            codeTextArea.style.color = codeTextFgColor();
         }

         if (codeSelector != null) {
            codeSelector.style.backgroundColor = codeSelectorBgColor();
            codeSelector.style.color = codeSelectorFgColor();
         }
      },

      figureOutLink : function() {

         // END ON A LINK: DELETE THE LINK.

         if (outSketch == null && linkAtCursor != null)
            deleteLinkAtCursor();

         // END ON ANOTHER SKETCH: CREATE A NEW LINK.

         else if (outSketch != null && inSketch != outSketch && inPort >= 0)
            this.createLink();

         // DOUBLE CLICK ON AN OUT-PORT TOGGLES WHETHER TO SHOW LIVE DATA FOR THIS SKETCH.

         else if (outSketch != null && isHover() && sk() == outSketch && findOutPortAtCursor(sk()) == outPort) {
            sk().isShowingLiveData = ! sk().isShowingLiveData;
            return;
         }

         // END ON BACKGROUND: CREATE A NEW LINK TO A NEW OUTPUT VALUE SKETCH.

         else if (outSketch != null && isMouseOverBackground) {
            inSketch = this.createTextSketch("   ");
            inSketch = new numeric_sketch();

            inPort = 0;
            this.createLink();
         }

         outSketch = inSketch = null;
         outPort = inPort = -1;
      },

      scaleSelectedSketch : function() {
         if (isk() && ! isManualScaling) {
            if (sketchAction == "scaling") {
               if (this.scaleRate < 1)
                  this.scaleRate = mix(this.scaleRate, 1, .1);
            }
            else if (this.scaleRate > 0) {
               if ((this.scaleRate = mix(this.scaleRate, 0)) < .01, .1)
                  this.scaleRate = 0;
            }
            if (this.scaleRate > 0) {
               var dy = this.yDown - this.moveY;
               sk().scale(pow(dy > 0 ? 1.015 : 1/1.015, this.scaleRate * abs(dy) / 100));
            }
         }
      },

      animate : function(elapsed) {

         var w = width();
         var h = height();

         if (sketchToDelete != null) {
            deleteSketch(sketchToDelete);
            sketchToDelete = null;
         }

         if (nsk() == 0)
            outPort = -1;

         if (this.fadeAway > 0)
            this.doFadeAway(elapsed);

         noisy = 1;

         // WHILE BEING DRAWN, EACH SKETCH TEMPORARILY BECOMES, IN TURN, THE CURRENT SKETCH.
         // WE CAN LOOK AT sketchPage.trueIndex TO FIND OUT WHAT THE REAL CURRENT SKETCH IS.

         this.trueIndex = this.index;
         var skTrue = sk();

         function xOnPanStrip(x) { return x * margin / (isVerticalPan ? w : h) + (isVerticalPan ? w - margin : 0) - _g.panX; }
         function yOnPanStrip(y) { return y * margin / (isVerticalPan ? w : h) + (isVerticalPan ? 0 : h - margin) - _g.panY; }

         this.isOnPanStrip = isVerticalPan ? isRightHover 
                                           : isBottomHover;

         if (this.isLinedPaper !== undefined) {
            annotateStart();
/*
// GRAPH PAPER

            var r = w / 32;
            color(defaultPenColor);
            lineWidth(backgroundColor == 'white' ? 0.1 : 0.15);
            var x0 = r * floor(-_g.panX / r);
            var x1 = x0 + w + r;
            var y1 = this.y >= h - margin ? h - margin : h;
            for (var x = x0 ; x < x1 ; x += r)
               line(x, 0, x, y1);
            for (var y = r ; y < y1 ; y += r)
               line(x0, y, x1, y);
*/
// LINED PAPER

            var r = 45;
            color('rgb(128,192,255)');
            lineWidth(2);
            //var x0 = r * floor(-_g.panX / r);
            var x0 = 0;
            var x1 = x0 + w - (this.x >= w - margin || isRightGesture ? margin + 1 : 0);
            var y0 = 0;
            var y1 = (this.y + _g.panY >= h - margin ? h - margin : h) - _g.panY;
            for (var y = y0 ; y < y1 ; y += r)
               line(x0, y, x1, y);

            color('rgb(255,128,192)');
            lineWidth(1);
            line(x0 + 3 * r, 0, x0 + 3 * r, y1);
            line(x0 + 3 * r + 5, 0, x0 + 3 * r + 5, y1);

            annotateEnd();
         }

	 if (xmlWriteEnabled)
	    xmlWriteStartFrame();

// DRAW ALL THE SKETCHES.

         for (var I = 0 ; I < nsk() ; I++) {

            // DO NOT RENDER ANY GEOMETRY SKETCH THAT IS PANNED OFF THE SCREEN.

            if ( sk(I) instanceof GeometrySketch &&
                 sk(I).xlo !== undefined && (sk(I).xhi + _g.panX < 0 || sk(I).xlo + _g.panX > w)
                                         && (sk(I).yhi + _g.panY < 0 || sk(I).ylo + _g.panY > h) )
               continue;

            if (sk() == null)
               break;

            _g_sketchStart();

            var PUSHED_sketchPage_index = this.index;

            this.index = I;

            sk().updateSelectionWeights(elapsed);

            color(sk().color);

            lineWidth(sketchLineWidth * mix(1, .6, sk().styleTransition)
                                      * this.zoom / sk().zoom);

            _g.save();

            // FADE AWAY THIS SKETCH BEFORE DELETING IT.

            if (sk().fadeAway > 0) {
               sk().fadeAway = max(0, sk().fadeAway - elapsed / 0.25);
               if (sk().fadeAway == 0) {
                  deleteSketch(sk());
                  _g.restore();
                  _g.globalAlpha = 1;
                  bgClickCount = 0;
                  I--;
                  continue;
               }
               _g.globalAlpha = sk().fade();
            }

            if (sk().sketchTrace != null && sk().sketchState != 'finished') {
               sk().trace = [];
            }

            if (sk() instanceof Sketch2D) {
               isDrawingSketch2D = true;
               if (sk().x2D == 0) {
                  sk().x2D = This().mouseX;
                  sk().y2D = This().mouseY;
               }
               sk().renderWrapper(elapsed);
               isDrawingSketch2D = false;
            }
            else {
               m.save();
                  computeStandardView();
                  sk().renderWrapper(elapsed);
               m.restore();
            }

            if (sk().sketchTrace != null && sk().sketchState != 'finished') {
               if (sk().createMesh !== undefined) {
                  var alpha = 1 - sk().glyphTransition;
                  if (alpha > 0) {
                     _g.globalAlpha = alpha * alpha;
                     morphSketchToGlyphSketch();
                  }
               }
               else
                  morphSketchToGlyphSketch();

               var rate = sk().glyphTransition < 0.5 ? 1 : 1.5;
               sk().glyphTransition = min(1, sk().glyphTransition + rate * elapsed);

               if (sk().glyphTransition == 1) {
                  finishDrawingUnfinishedSketch();
                  sk().sketchTrace = null;
               }
            }

            _g.restore();
            _g.globalAlpha = 1;

            _g_sketchEnd();

            if (sk().hasMotionPath() && skTrue.hasMotionPath() && sk().colorId == skTrue.colorId) {
               var X = sk().motionPath[0];
               var Y = sk().motionPath[1];
               _g.strokeStyle = 'rgba(' + paletteRGB[sk().colorId][0] + ',' +
                                          paletteRGB[sk().colorId][1] + ',' +
                                          paletteRGB[sk().colorId][2] + ', 0.5)';

               // DRAW MOTION PATH

               _g.lineWidth = 5;
               _g.beginPath();
               _g.moveTo(X[0], Y[0]);
               for (var i = 1 ; i < X.length ; i++)
                  _g.lineTo(X[i], Y[i]);

               // DRAW ARROWHEAD AT END OF MOTION PATH

               var n = X.length;
               for (var i = n - 1 ; i >= 0 ; i--) {
                  var dx = X[n-1] - X[i];
                  var dy = Y[n-1] - Y[i];
                  var d = len(dx, dy);
                  if (d > clickSize()) {
                     d *= 50 / width();
                     _g.moveTo(X[n-1] - (dx+dy) / d, Y[n-1] - (dy-dx) / d);
                     _g.lineTo(X[n-1], Y[n-1]);
                     _g.lineTo(X[n-1] - (dx-dy) / d, Y[n-1] - (dy+dx) / d);
                     break;
                  }
               }

               _g.stroke();
            }

            // ADD SKETCH TO THE PAN STRIP.

            if (this.isOnPanStrip) {
               lineWidth(_g.lineWidth * margin / (isVerticalPan ? w : h));
               if (sk() instanceof GeometrySketch) {
                  var x0 = xOnPanStrip(min(sk().sp[0][0], sk().sp[1][0]));
                  var y0 = yOnPanStrip(min(sk().sp[0][1], sk().sp[1][1]));
                  var x1 = xOnPanStrip(max(sk().sp[0][0], sk().sp[1][0]));
                  var y1 = yOnPanStrip(max(sk().sp[0][1], sk().sp[1][1]));
                  color(scrimColor(.2));
                  _g.beginPath();
                  _g.moveTo(x0, y0);
                  _g.lineTo(x1, y0);
                  _g.lineTo(x1, y1);
                  _g.lineTo(x0, y1);
                  _g.fill();
               }
               else {
                  _g.beginPath();
                  for (var i = 0 ; i < sk().sp.length ; i++) {
                     var x = xOnPanStrip(sk().sp[i][0]);
                     var y = yOnPanStrip(sk().sp[i][1]);
                     if (sk().sp[i][2] == 0)
                        _g.moveTo(x, y);
                     else
                        _g.lineTo(x, y);
                  }
                  _g.stroke();
               }
            }

            this.index = PUSHED_sketchPage_index;
         }

	 if (xmlWriteEnabled)
	    xmlWriteEndFrame();

         // IF THERE IS A STROKES SKETCH, CREATE ITS CORRESPONDING SHAPE.

         var shapeInfo = null;
         for (var I = 0 ; I < nsk() ; I++)
            if (sk(I) instanceof StrokesSketch && sk(I).shapeInfo !== undefined) {
               shapeInfo = sk(I).shapeInfo;
               delete sk(I).shapeInfo;
               break;
            }

         if (shapeInfo != null) {

            glyphSketch = null;
            eval(shapeInfo.type + "Sketch()");

            sk().isOutline = true;
            sk().mesh.setMaterial(bgMaterial());
            sk().mesh.setMaterial(backgroundColor == 'white' ? new THREE.LineBasicMaterial() : blackMaterial);
            sk().rX = shapeInfo.rX;
            sk().rY = shapeInfo.rY;
            sk().bounds = shapeInfo.bounds;
            sk().sw = shapeInfo.sw;
         }

         noisy = 0;

         // HIGHLIGHT THIS SCREEN RECTANGLE IN THE PAN STRIP.

         if (this.isOnPanStrip) {
            var dx = isVerticalPan ? 0 : -_g.panX;
            var dy = isVerticalPan ? -_g.panY : 0;
            var x0 = xOnPanStrip(dx    ), y0 = yOnPanStrip(dy    );
            var x1 = xOnPanStrip(dx + w), y1 = yOnPanStrip(dy + h) - 2;
            this.panViewBounds = [x0, y0, x1, y1];

            color(scrimColor(0.06));
            fillRect(x0, y0, x1 - x0, y1 - y0);
            color(scrimColor(1));
            lineWidth(0.5);
            drawRect(x0, y0, x1 - x0, y1 - y0);
         }

         if (isExpertMode) {
            if (letterPressed == 'g' || this.isCreatingGroup)
               drawGroupPath(groupPath);
            if (this.isShowingPalette())
               drawPalette();
         }

	 // SHOW HINT AFTER CLICK ON BACKGROUND

	 if (! isExpertMode && bgClickCount == 1) {
	    function bigDot(x,y) { line(x - 1, y - 1, x, y); }
	    annotateStart();
	    color(overlayColor);
	    var d = 20;
	    lineWidth(d);
	    bigDot(bgClickX, bgClickY);
	    if (isHover()) {
	       _g.font = d + 'pt Arial';
	       var dir = pieMenuIndex(bgClickX - This().mouseX, bgClickY - This().mouseY, 8);
	       _g.fillText(sketchClickActionName(dir, sk()), bgClickX + d, bgClickY + d/2);
	    }
	    annotateEnd();
         }

         if (isSpacePressed)
            drawHelpMenu();

         if (isTextMode)
            this.drawTextStrokes();

         renderer.render(renderer.scene, renderer.camera);

         // DRAW THE SPEECH BUBBLE FOR THE CODE WIDGET.

         if (isCodeWidget) {
            drawCodeWidget(isCodeScript() ? codeScript() : code(),
                           codeSketch.xlo, codeSketch.ylo,
                           codeSketch.xhi, codeSketch.yhi,
                           codeElement.codeSketch != codeSketch);
            codeElement.codeSketch = codeSketch;
         }

         if (this.paletteColorDragXY != null) {
            color(palette[paletteColorId]);
            fillRect(this.paletteColorDragXY[0] - 12,
                     this.paletteColorDragXY[1] - 12, 24, 24);
         }

      },

      glyphBounds : function(i) {
         var ht = height() / this.glyphsPerCol;
         var x = ht / this.glyphsPerCol / 2 + ht * floor(i / this.glyphsPerCol) - _g.panX;
         var y = ((i % this.glyphsPerCol) * height()) / this.glyphsPerCol + ht * .1 - _g.panY;
         return [ x, y, x + ht * .7, y + ht * .8 ];
      },

      glyphColor : function() {
         return backgroundColor == 'white' ? 'rgb(0,100,200)'       : 'rgb(128,192,255)' ;
      },
      glyphScrim : function() {
         return backgroundColor == 'white' ? 'rgba(128,192,255,.5)' : 'rgba(0,80,128,.5)';
      },

      isShowingPalette : function() {
         return this.paletteColorDragXY != null ||
	        This().mouseX < margin - _g.panX && ! isBottomGesture && ! isShowingGlyphs;
      },

      showGlyphs : function() {
         _g.save();
         _g.globalAlpha = 1.0;

         color(bgScrimColor(.5));
         fillRect(-_g.panX - 100, 0, width() + 200 - _g.panY, height());

         _g.textHeight = floor(7 * height() / 800);
         _g.font = _g.textHeight + 'pt Arial';

         this.glyphT = this.isDraggingGlyph
                     ? this.iDragged + 0.99
                     : this.glyphsPerCol * (floor((this.mx + _g.panX) / (height()/this.glyphsPerCol)) +
                             max(0, _g.panY + min(.99, this.my / height())));

         for (var i = 0 ; i < glyphs.length ; i++)
            this.showGlyph(i);

         if (this.isDraggingGlyph)
            this.showGlyph(this.iDragged, This().mouseX, This().mouseY);

         _g.restore();
      },

      showGlyph : function(i, cx, cy) {
         var glyph = glyphs[i];
         var nn = glyph.data.length;
         var b = this.glyphBounds(i);
         var gX = b[0], gY = b[1], gW = b[2]-b[0], gH = b[3]-b[1];
         if (isDef(cx)) {
            gX += cx - (b[0] + b[2]) / 2;
            gY += cy - (b[1] + b[3]) / 2;
         }
         var x = gX + (height()/this.glyphsPerCol) * .1;
         var y = gY;
         var t = this.glyphT;

         var txt = glyphs[i].indexName;

         color(this.glyphScrim());
         var gR = 4;
         fillPolygon(createRoundRect(gX, gY, gW, gH, gR));

         lineWidth(0.5);
         color(this.glyphColor());
         var r2 = 0.707;
         if (backgroundColor == 'white') {
            line(gX + gW, gY + gH - gR, gX + gW, gY + gR);
            line(gX + gW - gR, gY + gH, gX + gR, gY + gH);
            var rx = gX + gW - gR + r2 * gR;
            var ry = gY + gH - gR + r2 * gR;
            line(gX + gW - gR, gY + gH, rx, ry);
            line(gX + gW, gY + gH - gR, rx, ry);
         }
         else {
            line(gX + gR, gY, gX + gW - gR, gY);
            line(gX, gY + gR, gX, gY + gH - gR);
            var rx = gX + gR - r2 * gR;
            var ry = gY + gR - r2 * gR;
            line(gX + gR, gY, rx, ry);
            line(gX, gY + gR, rx, ry);
         }

         _g.fillStyle = t >= i && t < i+1 ? defaultPenColor : this.glyphColor();

         var tw = textWidth(txt);
         _g.fillText(txt, gX + 2, y + 10.5);

         y += height() / 45 * 10 / this.glyphsPerCol;

         var selected = t >= i && t < i+1 || (this.nnSelected & 1 << nn) != 0;
         _g.strokeStyle = selected ? defaultPenColor : this.glyphColor();
         _g.fillStyle = selected ? defaultPenColor : this.glyphColor();
         _g.lineWidth = selected ? 2 : 1;

         var sc = height() / 2000 * 10 / this.glyphsPerCol;
         for (var n = 0 ; n < nn ; n++) {

            var d = glyph.data[n];
            if (selected && mix(i, i+1, n / nn) <= t)
               fillOval(x + d[0][0] * sc - 3, y + d[0][1] * sc - 3, 6, 6);
            _g.beginPath();
            _g.moveTo(x + d[0][0] * sc, y + d[0][1] * sc);
            for (var j = 1 ; j < d.length ; j++) {
               if (selected && mix(i, i+1, (n + j / d.length) / nn) > t)
                  break;
               _g.lineTo(x + d[j][0] * sc, y + d[j][1] * sc);
            }
            _g.stroke();
         }
      },

      overlay : function() {

         var w = width(), h = height();
         var dx = -_g.panX;

         // SHOW THE GLYPH DICTIONARY

         if (isShowingGlyphs)
            this.showGlyphs();

         annotateStart();

         // DRAW THE COLOR PALETTE

         if (this.isShowingPalette())
            drawPalette();

         color(overlayColor);

         line(dx+w,0, dx+w,h);
         line(dx+0,h, dx+w,h);

         // LIGHTLY OUTLINE ALL SKETCHES

         _g.save();
         lineWidth(.5);
         for (var i = 0 ; i < nsk() ; i++)
            sk(i).drawBounds();
         _g.restore();

         _g.save();
         _g.font = '30pt Helvetica';
         _g.fillStyle = overlayColor;
         _g.fillText("PAGE " + sketchBook.page, dx + 60, 40);
         _g.restore();

         if (this.isWhiteboard)
            text("WHITEBOARD", w - 20, 20, 1, 1);

         // REMIND THE PRESENTER IF CARRYING OUT A SKETCH ACTION.

         if (sketchAction != null) {
            _g.font = 'bold 60pt Calibri';
            color('rgba(0,32,128,.15)');
            _g.fillText(sketchAction, (w - textWidth(sketchAction)) / 2, 80);
         }

         // REMIND THE PRESENTER WHEN INTERFACE IS IN TEXT INSERTION MODE.

         if (isCreatingGlyphData) {
            color(overlayColor);
            _g.font = 'bold 20pt Calibri';
            var str = "outputting glyphs";
            _g.fillText(str, w - textWidth(str) - 20, 35);
         }

         if (isTextMode)
            this.drawTextModeMessage();

         // REMIND THE PRESENTER WHEN INTERFACE IS IN AUTO-SKETCHING MODE.

         if (isk() && sk().sketchProgress < 1) {
            color('rgba(0,32,128,.2)');
            fillRect(0,0,w,h);
            _g.font = 'bold 40pt Calibri';
            var msg = "Finish drawing the sketch";
            color('rgba(0,32,128,.3)');
            _g.fillText(msg, (w - textWidth(msg)) / 2, 80);
         }

         // DRAW EXTRA INFORMATION AROUND THE SELECTED SKETCH.

         if (isk()) {
            color(sk().isGroup() ? 'rgba(255,1,0,.10)' : 'rgba(0,64,255,.06)');
            fillRect(sk().xlo, sk().ylo, sk().xhi-sk().xlo, sk().yhi-sk().ylo);

            if (isHover()) {
	       _g.save();
               color(sk().isGroup() ? 'rgba(255,1,0,.6)' : 'rgba(0,64,255,.4)');
	       lineWidth(4);
               sk().drawBounds();
	       _g.restore();
            }

            if (! isHover() && ! isTextMode
                            && sk() instanceof SimpleSketch
                            && sk().text.length == 0
                            && ! sk().isGroup()
                            && sk().sp.length <= 1 )
               deleteSketch(sk());
         }

         if (letterPressed == 'g' || this.isCreatingGroup)
            drawGroupPath(groupPath);

         // SHOW PRESENTER THE AUTO-SKETCHING GUIDE PATTERN.

         if (nsk() > 0 && sk().sp.length > 0
                       && sk().sketchProgress < 1
                       && ! sk().isSimple()) {

            var x0 = sk().sp[0][0], y0 = sk().sp[0][1], r = 14;
            fillPolygon([ [x0-r,y0], [x0,y0-r], [x0+r,y0], [x0,y0+r] ]);

            for (var i = 1 ; i < sk().sp.length ; i++) {
               var p = sk().sp[i-1];
               var q = sk().sp[i];
               lineWidth(2);
               color(q[2] == 0 ? 'rgba(0,64,255,.1)' :
                                 'rgba(0,64,255,.5)' );
               var x = (p[0] + q[0]) / 2;
               var y = (p[1] + q[1]) / 2;
               arrow(p[0], p[1], x, y);
               line(x, y, q[0], q[1]);
            }
         }

         // IF NOT IN TEXT INSERTION MODE, SHOW THE AVAILABLE KEYBOARD SHORTCUTS.

         if (! isShowingGlyphs && ! isTextMode) {
            color(overlayColor);
            lineWidth(1);
            textHeight(9);
            var y0 = paletteY(palette.length);
            for (var j = 0 ; j < hotKeyMenu.length ; j++) {
               var y = y0 + j * 13;
               utext(hotKeyMenu[j][0], dx + 8, y, 0, 0, 'Arial');
               utext(hotKeyMenu[j][1], dx +38, y, 0, 0, 'Arial');
               if (hotKeyMenu[j][0] == letterPressed)
                  drawRect(dx + 3, y - 3, 30, 20);
            }
         }

         // SHOW LINKS BETWEEN SKETCHES.

         if (! this.isPressed)
            linkAtCursor = null;

         for (var I = 0 ; I < nsk() ; I++)
            if (sk(I).parent == null) {
               var a = sk(I);
               for (var i = 0 ; i < a.out.length ; i++)
                  if (isDef(a.out[i]))
                     for (var k = 0 ; k < a.out[i].length ; k++) {
                        var link = a.out[i][k];
                        link.draw(! isAudiencePopup());
                        if (! this.isPressed && isMouseNearCurve(link.C))
                           linkAtCursor = link;
                        if (linkAtCursor == link)
			   link.highlight();        // HIGHLIGHT LINK AT CURSOR.
                     }
            }

         if (isAudiencePopup() && ! isShowingGlyphs) {
            color('rgba(0,32,128,.2)');
            var msg = "AUDIENCE POPUP IS SHOWING";
            _g.font = 'bold 40pt Calibri';
            _g.fillText(msg, (w - textWidth(msg)) / 2, h - margin);
         }

         annotateEnd();
      },

      computePortBounds : function() {
         var saveFont = _g.font;
         _g.font = '12pt Calibri';
         for (var I = 0 ; I < nsk() ; I++) {
            var sketch = sk(I);
            if (sketch.parent == null)
               for (var i = 0 ; i < sketch.portName.length ; i++)
                  if (sketch.sketchProgress == 1 && isDef(sketch.portName[i])) {
                     var str = sketch.portName[i];
                     var A = sketch.portXY(i);
                     var tw = max(portHeight, textWidth(str) + 10);
                     var px = A[0] - tw/2;
                     var py = A[1] - portHeight/2;
                     var pw = tw;
                     var ph = portHeight;
                     sketch.portBounds[i] = [px, py, px + pw, py + ph];
                  }
         }
         _g.font = saveFont;
      },

      advanceCurrentSketch : function() {

         // AFTER SKETCHING: TRANSITION SKETCH STYLE AND RESTORE CURSOR POSITION.

         if (isk() && sk().sketchState == 'in progress')
            if (sk().sketchProgress < 1) {
               var n = sk().sp.length;
               sk().cursorX = sk().sp[n-1][0];
               sk().cursorY = sk().sp[n-1][1];
            }
            else {
               var t = sCurve(sk().cursorTransition);
               cursorX = mix(sk().cursorX, This().mouseX, t);
               cursorY = mix(sk().cursorY, This().mouseY, t);

               sk().styleTransition  = min(1, sk().styleTransition + 1.4 * This().elapsed);
               sk().cursorTransition = min(1, sk().cursorTransition + This().elapsed);

               if (sk().cursorTransition == 1)
                  sk().sketchState = 'finished';
            }
      },

      drawTextModeMessage : function() {
         var w = width(), h = height();
         color('rgba(0,32,128,.07)');
         fillRect(0,0,w,h);
         _g.font = 'bold 60pt Calibri';
         var msg = isShiftPressed ? "TAP TO EXIT TEXT MODE"
                                  : "tap to exit text mode" ;
         color('rgba(0,32,128,.2)');
         _g.fillText(msg, (w - textWidth(msg)) / 2, 80);

         if (isCreatingGlyphData) {
            var str = "outputting glyphs";
            _g.fillText(str, (w - textWidth(str)) / 2, 200);
         }
      },

      drawTextStrokes : function() {
         if (isCreatingGlyphData || This().mousePressed) {
            var ts = This().mousePressed ? strokes[0]
                                         : strokesGlyph == null ? []
                                         : strokesGlyph.data[0];

            if (isDef(ts) && ts.length > 0) {
               _g.lineWidth = 4;
               _g.beginPath();
               if (ts.length > 0) {
                  _g.moveTo(ts[0][0], ts[0][1]);
                  for (var i = 1 ; i < ts.length ; i++)
                     _g.lineTo(ts[i][0], ts[i][1]);
                  _g.stroke();
               }
            }
         }
      },

      sketchesAt : function(x, y) {
         var sketches = [];
         for (var I = nsk() - 1 ; I >= 0 ; I--)
            if (sk(I).parent == null && sk(I).contains(x,y))
               sketches.push(sk(I));
         return sketches;
      },
   };

   function convertTextSketchToGlyphSketch(sketch, x, y) {
      var indexName = sketch.text.trim();
      for (var n = 0 ; n < glyphs.length ; n++) {
         var glyph = glyphs[n];
         if (indexName == glyph.indexName) {
            deleteSketch(sketch, 6);
            var name = glyph.name;
            if (name.indexOf("(") < 0)
               return;
            var a = name.indexOf("'");
            if (a >= 0) {
               var b = name.indexOf("'", a+1);
               var c = name.indexOf("'", b+1);
               var d = name.indexOf("'", c+1);
               var type = name.substring(a+1, b);
               var label = name.substring(c+1, d);
               eval("addSketch(new " + type + "())");
               sk().setSelection(label);
               finishSketch();
               sk().tX = x - width()/2;
               sk().tY = y - height()/2;
            }
            else {
               eval(name);
               sk().tX += x - sketchPage.x;
               sk().tY += y - sketchPage.y;
            }
            if (bgs !== undefined)
               bgActionEnd();
            bgClickCount = 0;
            return;
         }
      }
   }

// GLOBAL VARIABLES PRIMARILY RELATED TO SKETCH PAGES.

var codeSketch = null;
var groupPath = [];
var groupSketches = {};
var isAudioSignal = false;
var isBgDragActionEnabled = false;
var isBottomHover = false;
var isCommandPressed = false;
var isControlPressed = false;
var isDrawingSketch2D = false;
var isFakeMouseDown = false;
var isManualScaling = false;
var isPanning = false;
var isRightGesture = false;
var isRightHover = false;
var isShiftPressed = false;
var isShowingGlyphs = false;
var isSketchDragActionEnabled = false;
var isSpacePressed = false;
var isTogglingMenuType = false;
var isVerticalPan = false;
var isVideoBackground = false;
var linkAtMouseDown = null;
var menuType = 0;
var needToStartSketchDragAction = false;
var paletteColorId = 0;
var pixelToPointMatrix = new THREE.Matrix4();
var pointToPixelMatrix = new THREE.Matrix4();
var showingLiveDataMode = 0;
var sketchBook = new SketchBook();
var sketchPage = sketchBook.setPage(0);
var sketchToDelete = null;
