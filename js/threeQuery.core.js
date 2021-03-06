var threeQuery = function() {
	var that=this;
	this.global = {};
	this.global.camera;
	this.global.world;
	this.global.canvasDom;
	this.global.canvasContainerDom = document.body;
	this.global.renderer;
	this.global.vrEffect;

	this.getWorldWidth = function() {
		return this.global.canvasContainerDom == document.body ? window.innerWidth : this.global.canvasContainerDom.offsetWidth;
	};

	this.getWorldHeight = function() {
		return this.global.canvasContainerDom == document.body ? window.innerHeight : this.global.canvasContainerDom.offsetHeight;
	};

	this.rightButtonEvent = function(func) {
		this.global.canvasContainerDom.oncontextmenu = function(e) {
			if(func) {
				func(e);
			}
			e.preventDefault();
		};
	};

	this.resize = function() {
		var width = this.getWorldWidth();
		var height = this.getWorldHeight();
		if(this.global.camera.type == "PerspectiveCamera") {
			this.global.camera.aspect = width / height;
			this.global.camera.updateProjectionMatrix();
		} else {
			this.global.camera.left = -width / 2;
			this.global.camera.right = width / 2;
			this.global.camera.top = height / 2;
			this.global.camera.bottom = -height / 2;
			this.global.camera.updateProjectionMatrix();
		}
		this.global.renderer.setSize(width, height);
		if($$.global.settings.vr && $$.global.vrEffect) {
			this.global.vrEffect.setSize(width, height);
		}
	};
	//设置最基本的css
	this.setCommonCSS = function() {
		document.write("<style>*{margin:0;padding:0} body{overflow:hidden}</style>");
	};

	this.createWorld = function(options) {
		var world = new THREE.Scene();
		if(!this.global.world) {
			this.global.world = world;
		}
		this.rayCasterEventReceivers=this.global.world.children;
		return world;
	};

	this.createFog = function(option, world) {
		option = option || {
			color: 0xffffff,
			concentration: 0.01
		};
		var scene = world || this.global.world;
		scene.fog = new THREE.FogExp2(option.color || 0, option.concentration || 0);
		return scene.fog;
	};

	this.createRenderer = function(options) {
		options = this.extends({}, [this.global.settings.render, options]);
		var renderer = new THREE.WebGLRenderer(options);
		renderer.setPixelRatio( window.devicePixelRatio );
		renderer.setSize(this.getWorldWidth(), this.getWorldHeight());
		if(!this.global.renderer) {
			this.global.renderer = renderer;
			this.global.canvasContainerDom.appendChild(this.global.renderer.domElement);
			if($$.global.settings.vr) {
				this.global.vrEffect = new THREE.StereoEffect(this.global.renderer);
			}
			this.global.canvasDom = this.global.renderer.domElement;
		}

		return renderer;
	};
	this.createCamera = function(options) {
		var camera;
		var options = this.extends({}, [this.global.settings.camera, options]);
		if(options.type != "OrthographicCamera") {
			camera = new THREE.PerspectiveCamera(options.fov, options.aspect, options.near, options.far);
		} else {
			camera = new THREE.OrthographicCamera(options.left, options.right, options.top, options.bottom, options.near, options.far);
		}
		if(!this.global.camera) {
			this.global.camera = camera;
		}
		return camera;
	};

	this.init = function(worldOpt, renderOpt, cameraOpt) {
		this.setCommonCSS();
		this.createWorld(worldOpt);
		this.createRenderer(renderOpt);
		this.createCamera(cameraOpt);
		this.addEventListener();
		return [this.global.world, this.global.renderer, this.global.camera];
	};
	//添加鼠标事件
	this.addEventListener = function() {
		//鼠标移动事件
		function onDocumentMouseMove(event) {
			event.preventDefault();
			$$.global.mouse.x = (event.clientX / $$.getWorldWidth()) * 2 - 1;
			$$.global.mouse.y = -(event.clientY / $$.getWorldHeight()) * 2 + 1;
			if($$.global.selectedObj && $$.global.selectedObj.object.onDrag && $$.global.isDown) {
				$$.global.selectedObj.object.onDrag($$.global.selectedObj);
			}
		}

		function onDocumentMouseClick(event) {
			if($$.global.selectedObj && $$.global.selectedObj.object.onClick && $$.global.selectedObj.object.isDown == true) {
				$$.global.selectedObj.object.isDown = false;
				$$.global.selectedObj.object.onClick($$.global.selectedObj, event);
			}
			if($$.global.centerSelectedObj && $$.global.centerSelectedObj.object.onCenterClick && $$.global.centerSelectedObj.object.isCenterDown == true) {
				$$.global.centerSelectedObj.object.isCenterDown = false;
				$$.global.centerSelectedObj.object.onCenterClick($$.global.centerSelectedObj, event);
			}
		}

		function onMouseDownOrTouchStart(event) {
			if(event.type == "touchstart") {
				$$.global.mouse.x = (event.targetTouches[0].clientX / $$.getWorldWidth()) * 2 - 1;
				$$.global.mouse.y = -(event.targetTouches[0].clientY / $$.getWorldHeight()) * 2 + 1;
				updateMouseRaycaster(true);
			}

			$$.global.isDown = true;
			if($$.global.selectedObj && $$.global.selectedObj.object) {
				$$.global.selectedObj.object.isDown = true;
			}
			if($$.global.selectedObj && $$.global.selectedObj.object.onDown) {
				$$.global.selectedObj.object.onDown($$.global.selectedObj, event);
			}

			$$.global.isCenterDown = true;
			if($$.global.centerSelectedObj && $$.global.centerSelectedObj.object) {
				$$.global.centerSelectedObj.object.isCenterDown = true;
			}
			if($$.global.centerSelectedObj && $$.global.centerSelectedObj.object.onCenterDown) {
				$$.global.centerSelectedObj.object.onCenterDown($$.global.centerSelectedObj, event);
			}
		}

		function onMouseUpOrTouchEnd(event) {
			$$.global.isDown = false;
			if($$.global.selectedObj && $$.global.selectedObj.object.onUp && $$.global.selectedObj.object.isDown == true) {
				$$.global.selectedObj.object.onUp($$.global.selectedObj, event);
			}

			$$.global.isCenterDown = false;
			if($$.global.centerSelectedObj && $$.global.centerSelectedObj.object.onCenterUp && $$.global.centerSelectedObj.object.isCenterDown == true) {
				$$.global.centerSelectedObj.object.onCenterUp($$.global.centerSelectedObj, event);
			}
		}
		$$.global.canvasContainerDom.addEventListener("click", onDocumentMouseClick);
		$$.global.canvasContainerDom.addEventListener("mousemove", onDocumentMouseMove);
		$$.global.canvasContainerDom.addEventListener("mousedown", onMouseDownOrTouchStart);
		$$.global.canvasContainerDom.addEventListener("mouseup", onMouseUpOrTouchEnd);
		$$.global.canvasContainerDom.addEventListener("touchstart", onMouseDownOrTouchStart);
		$$.global.canvasContainerDom.addEventListener("touchend", onMouseUpOrTouchEnd);
	};

	this.sceneCoordinateToCanvasCoordinate = function(obj, world) {
		var worldVector = obj.position.clone();
		if(world) {
			var vector = worldVector.project(world.camera);
		} else {
			var vector = worldVector.project($$.global.camera);
		}

		var halfWidth = $$.getWorldWidth() / 2;
		var halfHeight = $$.getWorldHeight() / 2;

		var result = {
			x: Math.round(vector.x * halfWidth + halfWidth),
			y: Math.round(-vector.y * halfHeight + halfHeight)
		};
		return result;
	};
	
	window.addEventListener("resize",function(){
		if($$.global.settings.resize) {
			$$.resize();
		}
	},false);

	this.animate = function() {
		requestAnimationFrame($$.animate);
		if($$.global.settings.renderPause) {
			return;
		}
		$$.worldActions();
		for(var i in $$.actionInjections) {
			if($$.actionInjections[i] instanceof Function == true) {
				$$.actionInjections[i]();
			}
		}
		if($$.global.settings.raycaster) {
			updateRaycaster();
		}
		if($$.global.settings.vr) {
			if(!$$.global.vrEffect) {
				$$.global.vrEffect = new THREE.StereoEffect($$.global.renderer);
			}
			$$.global.renderer.render($$.global.world, $$.global.camera);
			$$.global.vrEffect.render($$.global.world, $$.global.camera);
		} else {
			$$.global.renderer.render($$.global.world, $$.global.camera);
		}
		if($$.global.controls) {
			$$.global.controls.update();
		}
	};
	this.actionInjections = [];
	this.worldActions = function() {};

	this.extends = function(des, src, over) {
		var res = extend(des, src, over);

		function extend(des, src, over) {
			var override = true;
			if(over === false) {
				override = false;
			}
			if(src instanceof Array) {
				for(var i = 0, len = src.length; i < len; i++)
					extend(des, src[i], override);
			}
			for(var i in src) {
				if(override || !(i in des)) {
					des[i] = src[i];
				}
			}
			return des;
		}
		for(var i in src) {
			delete res[i];
		}
		return res;
	};

	this.openFullScreen = function() {
		var container = $$.global.canvasContainerDom;
		$$.global.settings.isFullScreem = true;
		if(container.requestFullscreen) {
			container.requestFullscreen();
		} else if(container.msRequestFullscreen) {
			container.msRequestFullscreen();
		} else if(container.mozRequestFullScreen) {
			container.mozRequestFullScreen();
		} else if(container.webkitRequestFullscreen) {
			container.webkitRequestFullscreen();
		} else {
			$$.global.settings.isFullScreem = false;
		}
		return $$.global.settings.isFullScreem;
	};
	this.closeFullScreen = function() {
		var container = document;
		$$.global.settings.isFullScreem = false;
		if(container.exitFullscreen) {
			container.exitFullscreen();
		} else if(container.mozCancelFullScreen) {
			container.mozCancelFullScreen();
		} else if(container.webkitExitFullScreen) {
			container.webkitExitFullScreen();
		} else if(container.msExitFullscreen) {
			container.msExitFullscreen();
		} else if(container.webkitCancelFullScreen) {
			container.webkitCancelFullScreen();
		}
		if(container.webkitExitFullScreen) {
			container.webkitCancelFullScreen();
		}
		return $$.global.settings.isFullScreem;
	};
	this.toggleFullScreen = function() {
		if($$.global.settings.isFullScreem) {
			this.closeFullScreen();
		} else {
			this.openFullScreen();
		}
	};

	this.groups = {}; //添加小组，可以把不同的物体放在不同的组里。并且后续的性能优化，操作方式都会用到group。但是这个group只是把里面的物体进行分类，不进行其他任何操作
	//传入一个group的名称,每个名称的group都是个单例
	this.createGroup = function(str) {
		if($$.groups[str]) {
			return $$.groups[str];
		}
		var g = new $$.ThreeGroup(str);
		$$.groups[str] = g;
		return g;
	};

	this.removeGroup = function(str) {
		if($$.groups[str]) {
			var arr = $$.groups[str].children;
			delete $$.groups[str];
			return arr;
		}
		return [];
	};
	this.global.mouse = new THREE.Vector2();
	this.global.mouse.x = NaN;
	this.global.mouse.y = NaN;
	this.global.raycaster = new THREE.Raycaster();
	this.global.centerRaycaster = new THREE.Raycaster();

	this.global.selectedObj = null;
	this.global.centerSelectedObj = null;

	this.rayCasterEventReceivers = [];

	function updateMouseRaycaster(isTouch) {
		$$.global.raycaster.setFromCamera($$.global.mouse, $$.global.camera);
		var intersects = $$.global.raycaster.intersectObjects($$.rayCasterEventReceivers, true);

		var intersect;
		for(var i = 0; i < intersects.length; i++) {
			if(intersects[i].object.isPenetrated) {
				continue;
			} else {
				intersect = intersects[i];
				break;
			}
		}

		if(intersect) {
			if(($$.global.selectedObj == null) || ($$.global.selectedObj.object.uuid != intersect.object.uuid)) {
				if($$.global.selectedObj && $$.global.selectedObj.object.uuid != intersect.object.uuid && !isTouch) {
					if($$.global.selectedObj.object.onLeave) {
						$$.global.selectedObj.object.onLeave($$.global.selectedObj);
					}
				}
				$$.global.selectedObj = intersect;
				if($$.global.selectedObj.object.onEnter && !isTouch) {
					$$.global.selectedObj.object.onEnter($$.global.selectedObj);
				}
			} else {
				$$.global.selectedObj = intersect;
			}
		} else {
			if($$.global.selectedObj) {
				if($$.global.selectedObj.object.onLeave) {
					$$.global.selectedObj.object.onLeave($$.global.selectedObj);
				}
				$$.global.selectedObj = null;
			}
		}
	}

	function updateCenterRaycaster() {
		var centerV = new THREE.Vector2(0, 0);
		$$.global.centerRaycaster.setFromCamera(centerV, $$.global.camera);
		var intersects = $$.global.centerRaycaster.intersectObjects($$.rayCasterEventReceivers);
		var intersect;
		for(var i = 0; i < intersects.length; i++) {
			if(intersects[i].object.isPenetrated) {
				continue;
			} else {
				intersect = intersects[i];
				break;
			}
		}
		if(intersect) {
			if(($$.global.centerSelectedObj == null) || ($$.global.centerSelectedObj.object.uuid != intersect.object.uuid)) {
				if($$.global.centerSelectedObj && $$.global.centerSelectedObj.object.uuid != intersect.object.uuid) {
					if($$.global.centerSelectedObj.object.onCenterLeave) {
						$$.global.centerSelectedObj.object.onCenterLeave($$.global.centerSelectedObj);
					}
				}
				$$.global.centerSelectedObj = intersect;
				if($$.global.centerSelectedObj.object.onCenterEnter) {
					$$.global.centerSelectedObj.object.onCenterEnter($$.global.centerSelectedObj);
				}
			} else {
				$$.global.centerSelectedObj = intersect;
			}
		} else {
			if($$.global.centerSelectedObj) {
				if($$.global.centerSelectedObj.object.onCenterLeave) {
					$$.global.centerSelectedObj.object.onCenterLeave($$.global.centerSelectedObj);
				}
				$$.global.centerSelectedObj = null;
			}
		}
	}

	function updateRaycaster() {
		updateMouseRaycaster();
		updateCenterRaycaster();
	}

	this.ThreeGroup = function(str) {
		this.name = str;
		this.children = [];
		this.remove = function(obj) {
			for(var i in this.children) {
				if(obj == this.children[i]) {
					this.splice(i, 1);
					return;
				}
			}
		};
		this.push = function(obj) {
			for(var i in this.children) {
				if(obj == this.children[i]) {
					return i;
				}
			}
			this.children.push(obj);
			return i;
		};
	};
	this.get = function(str, group) {
		var key = str.split('=');
		var val = key[1];
		key = key[0];
		var arr = null,
			res = [];
		if(group) {
			if(typeof group == "string") {
				arr = $$.groups[group];
				if(arr) {

				} else {
					return [];
				}
			} else if(typeof group == "object") {
				arr = group.children;
			}
		} else {
			arr = $$.global.world.children;
		}
		if(arr) {
			if(key == "id") {
				for(var i = 0; i < arr.length; i++) {
					if(arr[i].id == val) {
						return arr[i];
					}
				}
			} else {
				for(var i = 0; i < arr.length; i++) {
					if(arr[i][key] == val) {
						res.push(arr[i]);
					}
				}
				return res;
			}
		}
		return [];
	};

	this.subWorlds = {
		children: {},
		getCurrentSubWorld: function() {
			for(var i in $$.subWorlds.children) {
				if($$.subWorlds.children[i].isCurrent) {
					return $$.subWorlds.children[i];
				}
			}
		},
		getSubWorldByName: function(name) {
			for(var i in $$.subWorlds.children) {
				if($$.subWorlds.children[i].name == name) {
					return $$.subWorlds.children[i];
				}
			}
		}
	};

	this.SubWorld = function(optWorld, optCamera) {
		this.name = optWorld.name || "";
		this.id = $$.rndString(16);
		this.scene = new THREE.Scene();
		this.camera = "";
		this.rayCasterEventReceivers = this.scene.children;
		var options = $$.extends({}, [$$.global.settings.camera, optCamera]);
		if(options.type != "OrthographicCamera") {
			this.camera = new THREE.PerspectiveCamera(options.fov, options.aspect, options.near, options.far);
		} else {
			this.camera = new THREE.OrthographicCamera(options.left, options.right, options.top, options.bottom, options.near, options.far);
		}
		this.actionInjections = [];
		renderTargetParameters = {
			minFilter: THREE.LinearFilter,
			magFilter: THREE.LinearFilter,
			format: THREE.RGBFormat,
			stencilBuffer: false
		};
		this.clearColor = optWorld.clearColor;
		this.alpha = optWorld.alpha == null ? 1 : optWorld.alpha;
		this.fbo = new THREE.WebGLRenderTarget($$.getWorldWidth(), $$.getWorldHeight(), renderTargetParameters);
		this.isResize = optWorld.resize == null ? true : optWorld.resize;
		this.resize = function() {
			var width = $$.getWorldWidth();
			var height = $$.getWorldHeight();
			if(this.camera.type == "PerspectiveCamera") {
				this.camera.aspect = width / height;
				this.camera.updateProjectionMatrix();
			} else {
				this.camera.left = -width / 2;
				this.camera.right = width / 2;
				this.camera.top = height / 2;
				this.camera.bottom = -height / 2;
				this.camera.updateProjectionMatrix();
			}
			$$.global.renderer.setSize(width, height);
			if($$.global.settings.vr && $$.global.vrEffect) {
				$$.global.vrEffect.setSize(width, height);
			}
		};
		this.update = function(rtt) {
			if(this.isResize) {
				this.resize();
			}
			for(var i = 0; i < this.actionInjections.length; i++) {
				this.actionInjections[i]();
			}
			if(rtt) {
				$$.global.renderer.render(this.scene, this.camera, this.fbo, true);
			} else {
				$$.global.renderer.render(this.scene, this.camera);
			}

		};
		this.isCurrent = false;
		this.toTexture = function() {
			return this.fbo.texture;
		};
		this.toMain = function() {
			$$.global.world = this.scene;
			$$.global.camera = this.camera;
			$$.actionInjections = this.actionInjections;
			$$.global.renderer.setClearColor(this.clearColor, this.alpha);
			$$.global.controls = this.controls;
			$$.rayCasterEventReceivers = this.rayCasterEventReceivers;
			for(var i in $$.subWorlds) {
				if($$.subWorlds[i].isCurrent) {
					$$.subWorlds[i].isCurrent = false;
					if($$.subWorlds[i].controls) {
						$$.subWorlds[i].controls.enabledBefore = $$.subWorlds[i].controls.enabled;
						$$.subWorlds[i].controls.enabled = false;
					}
				}
			}
			this.isCurrent = true;
			if(this.controls) {
				this.controls.enabled = this.controls.enabledBefore;
			}
		};
		$$.subWorlds.children[this.id] = this;
	};

	this.Transition = function(sceneA, option, texture) {
		var makeSubWorld = function(scene, camera, injections, clearColor) {
			var subWorld = {
				scene: scene,
				camera: camera,
				actionInjections: injections
			};
			renderTargetParameters = {
				minFilter: THREE.LinearFilter,
				magFilter: THREE.LinearFilter,
				format: THREE.RGBFormat,
				stencilBuffer: false
			};
			subWorld.fbo = new THREE.WebGLRenderTarget($$.getWorldWidth(), $$.getWorldHeight(), renderTargetParameters);
			subWorld.clearColor = clearColor;
			subWorld.update = function(rtt) {
				if($$.global.settings.resize) {
					var width = $$.getWorldWidth();
					var height = $$.getWorldHeight();
					if(subWorld.camera.type == "PerspectiveCamera") {
						subWorld.camera.aspect = width / height;
						subWorld.camera.updateProjectionMatrix();
					} else {
						subWorld.camera.left = -width / 2;
						subWorld.camera.right = width / 2;
						subWorld.camera.top = height / 2;
						subWorld.camera.bottom = -height / 2;
						subWorld.camera.updateProjectionMatrix();
					}
					$$.global.renderer.setSize(width, height);
				}
				$$.global.renderer.setClearColor(subWorld.clearColor);
				if(rtt)
					$$.global.renderer.render(subWorld.scene, subWorld.camera, subWorld.fbo, true);
				else {
					$$.global.renderer.render(subWorld.scene, subWorld.camera);
				}
			};
			return subWorld;
		};

		var transitionParams = $$.extends({}, [{
			"useTexture": true,
			"transition": 0,
			"transitionSpeed": 10,
			"texture": 5,
			"loopTexture": true,
			"animateTransition": true,
			"textureThreshold": 0.3
		}, option]);
		var sceneB = makeSubWorld($$.global.world, $$.global.camera, $$.actionInjections, $$.global.renderer.getClearColor().clone());

		this.scene = new THREE.Scene();
		this.cameraOrtho = $$.createCamera({
			type: "OrthographicCamera",
			near: -10,
			far: 10
		});
		this.texture = texture;
		this.quadmaterial = new THREE.ShaderMaterial({
			uniforms: {
				tDiffuse1: {
					value: null
				},
				tDiffuse2: {
					value: null
				},
				mixRatio: {
					value: 0.0
				},
				threshold: {
					value: 0.1
				},
				useTexture: {
					value: 1
				},
				tMixTexture: {
					value: this.texture
				}
			},
			vertexShader: [

				"varying vec2 vUv;",

				"void main() {",

				"vUv = vec2( uv.x, uv.y );",
				"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

				"}"

			].join("\n"),
			fragmentShader: [
				"uniform float mixRatio;",
				"uniform sampler2D tDiffuse1;",
				"uniform sampler2D tDiffuse2;",
				"uniform sampler2D tMixTexture;",
				"uniform int useTexture;",
				"uniform float threshold;",
				"varying vec2 vUv;",

				"void main() {",

				"vec4 texel1 = texture2D( tDiffuse1, vUv );",
				"vec4 texel2 = texture2D( tDiffuse2, vUv );",

				"if (useTexture==1) {",

				"vec4 transitionTexel = texture2D( tMixTexture, vUv );",
				"float r = mixRatio * (1.0 + threshold * 2.0) - threshold;",
				"float mixf=clamp((transitionTexel.r - r)*(1.0/threshold), 0.0, 1.0);",

				"gl_FragColor = mix( texel1, texel2, mixf );",
				"} else {",

				"gl_FragColor = mix( texel2, texel1, mixRatio );",

				"}",
				"}"

			].join("\n")
		});

		$$.global.world = this.scene;
		$$.global.camera = this.cameraOrtho;

		quadgeometry = new THREE.PlaneBufferGeometry($$.getWorldWidth(), $$.getWorldHeight());

		this.quad = new THREE.Mesh(quadgeometry, this.quadmaterial);
		this.scene.add(this.quad);

		this.sceneA = sceneA;
		this.sceneB = sceneB;

		this.quadmaterial.uniforms.tDiffuse1.value = sceneA.fbo.texture;
		this.quadmaterial.uniforms.tDiffuse2.value = sceneB.fbo.texture;

		this.needChange = false;

		this.setTextureThreshold = function(value) {

			this.quadmaterial.uniforms.threshold.value = value;

		};

		this.useTexture = function(value) {

			this.quadmaterial.uniforms.useTexture.value = value ? 1 : 0;

		};

		this.setTexture = function(i) {

			this.quadmaterial.uniforms.tMixTexture.value = this.texture;

		};

		this.render = function() {
			var owner = arguments.callee.owner;
			if($$.global.settings.resize) {
				var width = $$.getWorldWidth();
				var height = $$.getWorldHeight();
				owner.cameraOrtho.left = -width / 2;
				owner.cameraOrtho.right = width / 2;
				owner.cameraOrtho.top = height / 2;
				owner.cameraOrtho.bottom = -height / 2;
			}

			if(transitionParams.animateTransition) {
				transitionParams.transition += 0.001 * transitionParams.transitionSpeed;
			}
			owner.quadmaterial.uniforms.mixRatio.value = Math.min(transitionParams.transition, 1);
			if(transitionParams.transition === 0) {
				owner.sceneB.update(false);
			} else if(transitionParams.transition >= 1) {
				owner.sceneA.update(true);
				for(var i = 0; i < $$.actionInjections.length; i++) {
					if($$.actionInjections[i] == arguments.callee) {
						$$.actionInjections.splice(i, 1);
					}
				}
				owner.sceneA.toMain();

			} else {
				$$.global.renderer.setClearColor(owner.sceneB.clearColor);
				owner.sceneB.update(true);
				$$.global.renderer.setClearColor(owner.sceneA.clearColor);
				owner.sceneA.update(true);
				$$.global.renderer.render(owner.scene, owner.cameraOrtho, null, true);
			}
		};
		this.render.owner = this;
	};

	this.rndString = function(len) {
		if(len <= 0) {
			return "";
		}
		len = len - 1 || 31;　　
		var $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';　　
		var maxPos = $chars.length + 1;　　
		var pwd = $chars.charAt(Math.floor(Math.random() * (maxPos - 10)));
		for(i = 0; i < len; i++) {　　　　
			pwd += $chars.charAt(Math.floor(Math.random() * maxPos));　　
		}　　
		return pwd;
	};

	this.rndInt = function(max) {
		return Math.floor(Math.random() * max);
	};

	this.global.settings = {
		camera: {
			type: "PerspectiveCamera", //透视相機
			fov: 90, //视野广角，单位是度数
			aspect: this.getWorldWidth() / this.getWorldHeight(), //拉伸比例
			near: 1,
			far: 10000,
			left: -this.getWorldWidth() / 2, //这4个用于正交相机
			right: this.getWorldWidth() / 2,
			top: this.getWorldHeight() / 2,
			bottom: -this.getWorldHeight() / 2,
		},
		render: {
			alpha: false,
			antialias: true,
			clearColor: 0x000000,
			depth: true,
			logarithmicDepthBuffer: false,
			precision: "highp",
			premultipliedAlpha: false,
			preserveDrawingBuffer: false,
			stencil: true,
		},
		sea: {
			alpha: 1,
			color: 0x001e0f,
			width: 100000,
			height: 100000
		},
		raycaster: true, //启用射线法
		resize: true, //如果窗口大小改变则改变渲染大小
		renderPause: false, //暂停渲染循环
		vr: false, //显示VR效果,
		showLoadingProgress: false, //显示加载的进度条
		isFullScreem: false
	};
};
var $$ = new threeQuery();