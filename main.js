(async function initialize() {
  const ZV = new ZarboViewer(
    ".zarbo_widget",
    "8f047adf-933f-4821-9aa6-9b24cb4bdd91",
    "https://api-foroleg.zarbo.works"
  );
  await ZV.init();

  class Hotspot {
    constructor(name, animation, data_surface) {
      this._name = name;
      this.animation = animation;
      this.data_surface = data_surface;
      this.block = document.createElement("div");
      this.block.innerHTML = this._name;
      this.eventNewName = new Event("new-name", {
        bubbles: true,
        cancelable: true,
      });
    }
    set name(newName) {
      this._name = newName;
      this.block.innerHTML = this._name;
      this.block.dispatchEvent(this.eventNewName);
    }
    get name() {
      return this._name;
    }
  }
  class HotspotList {
    constructor() {
      this.hotspots = [];
    }

    add(hotspot, shouldSave = true) {
      console.log("add");

      this.hotspots.push(hotspot);

      hotspot.block.addEventListener("new-name", (event) => {
        console.log(`Name changed to: ${hotspot.name}`);
      });
      if (shouldSave) {
        this.saveHotspots();
      }
    }

    remove(name) {
      console.log("--------------remove--------------");
      this.hotspots = this.hotspots.filter((hs) => hs.name !== name);
      this.saveHotspots();
    }

    saveHotspots() {
      console.log("save");
      localStorage.setItem(
        "hotspots",
        JSON.stringify(
          this.hotspots.map((hs) => ({
            name: hs.name,
            animation: hs.animation,
            data_surface: hs.data_surface
          }))
        )
      );
    }

    loadHotspots() {
      const loadedHotspots = JSON.parse(localStorage.getItem("hotspots")) || [];
      this.hotspots = loadedHotspots.map((hs) => {
        const hotspot = new Hotspot(hs.name, hs.animation, hs.data_surface);
        this.add(hotspot, false);
        return hotspot;
      });
      console.log(localStorage);
      console.log(loadedHotspots);
    }
  }

  let editMode = false;
  let animNameCreate = [];
  const zarboViewer = document.querySelector(".zarbo_widget zarbo-widget");
  const editButton = document.getElementById("edit_button");
  const popupOn = document.getElementById("popupOn");
  const popupOff = document.getElementById("popupOff");
  const popupError = document.getElementById("popupError");
  const containerInput = document.getElementById("containerInput");
  const divNameInput = document.getElementById("divNameInput");
  const animationNameInput = document.getElementById("animationNameInput");
  const enterButton = document.getElementById("enter");
  const cancelButton = document.getElementById("cancel");
  const contextMenu = document.getElementById("contextMenu");

  const hotspotCreate = document.getElementById("createHotspot");
  const hotspotRename = document.getElementById("renameHotspot");
  const hotspotMove = document.getElementById("moveHotspot");
  const hotspotHighlight = document.getElementById("highlightHotspot");
  const hotspotVisible = document.getElementById("hideHotspot");
  const hotspotRemove = document.getElementById("removeHotspot");

  let doorCondition = false;
  let clickModel = false;
  let onMoveHotspot = true;
  let activeHotspotAction = null;

  const hotspotList = new HotspotList();
  hotspotList.loadHotspots();

  const actions = [
    { element: hotspotMove, action: "move" },
    { element: hotspotRename, action: "rename" },
    { element: hotspotHighlight, action: "highlight" },
    { element: hotspotVisible, action: "visible" },
    { element: hotspotRemove, action: "remove" },
  ];

  function displayNone(elem) {
    elem.style.display = "none";
  }

  function displayBlock(elem) {
    elem.style.display = "block";
  }

  editButton.addEventListener("click", (event) => {
    event.stopPropagation();
    editMode = !editMode;
    if (editMode) {
      clickModel = false;
      activeHotspotAction = null;
      resetHotspotFlags();
    }
    if (editMode) {
      displayBlock(popupOn);
      setTimeout(() => {
        displayNone(popupOn);
      }, 1500);
    } else {
      displayBlock(popupOff);
      setTimeout(() => {
        displayNone(popupOff);
      }, 1000);
    }
  });

  function outPopup() {
    divNameInput.value = "";
    animationNameInput.value = "";
    displayNone(containerInput);
    displayNone(contextMenu);
  }

  function createHotspotElement(text, animationName, surface) {
    const hotspotElement = document.createElement("button");
    const hotspotDiv = document.createElement("div");

    animNameCreate.push(animationName);
    hotspotElement.setAttribute("class", "Hotspot");
    hotspotElement.setAttribute("slot", `hotspot-${animNameCreate.length}`);
    hotspotElement.setAttribute("data-surface", surface);
    hotspotElement.setAttribute("data-visibility-attribute", "visible");
    hotspotElement.setAttribute("data-animation", animationName);
    hotspotDiv.setAttribute("class", "HotspotAnnotation");
    hotspotDiv.textContent = text;
    hotspotElement.appendChild(hotspotDiv);

    return hotspotElement;
  }

  ZV.widget.addEventListener("load", () => {
    hotspotList.hotspots.forEach((hotspot) => {
      createHotspot(
        hotspot.name,
        hotspot.animation,
        hotspot.data_surface,
        false
      );
    });
  });
  actions.forEach(({ element, action }) => {
    element.addEventListener("click", () => {
      activeHotspotAction = action;
      resetHotspotFlags();
      console.log(`Активное действие: ${action}`);
      displayNone(contextMenu);
    });
  });

  function setupEnterButton(enterButton, handleClick) {
    enterButton.removeEventListener("click", handleClick);
    enterButton.addEventListener("click", handleClick, { once: true });
  }

  cancelButton.addEventListener("click", outPopup);
  zarboViewer.addEventListener("contextmenu", (event) => {
    event.preventDefault();

    if (!editMode) return;

    const surface = zarboViewer.surfaceFromPoint(event.clientX, event.clientY);
    const newPos = zarboViewer.positionAndNormalFromPoint(
      event.clientX,
      event.clientY
    );

    if (surface !== null) {
      displayBlock(contextMenu);
      contextMenu.setAttribute(
        "data-position",
        `${newPos.position.x} ${newPos.position.y} ${newPos.position.z}`
      );
      clickCreateHS(surface);
    }
  });

  function createHotspot(text, animationName, surface, shouldSave = true) {
    const hotspotElement = createHotspotElement(text, animationName, surface);
    hotspotElement.addEventListener("click", async () => {
      if (!editMode) {
        playAnimation(animationName, doorCondition ? -1 : 1);
        doorCondition = !doorCondition;
      } else {
        switch (activeHotspotAction) {
          case "rename":
            renameDiv(
              hotspotElement,
              hotspotElement.querySelector(".HotspotAnnotation")
            );
            break;
          case "move":
            moveHS(hotspotElement);
            onMoveHotspot = !onMoveHotspot;
            break;
          case "highlight":
            hightlightHS(hotspotElement);
            break;
          case "visible":
            visibleHS(
              hotspotElement,
              hotspotElement.querySelector(".HotspotAnnotation")
            );
            break;
          case "remove":
            removeHS(
              hotspotElement,
              hotspotElement.querySelector(".HotspotAnnotation")
            );
            break;
          default:
            console.log("Нет активного действия.");
        }
      }
    });

    hotspotElement.addEventListener("mousedown", moveHS);
    zarboViewer.appendChild(hotspotElement);

    if (shouldSave) {
      const hotspot = new Hotspot(text, animationName, surface);
      hotspotList.add(hotspot, shouldSave);
    }
  }

  function clickCreateHS(surface) {
    hotspotCreate.onclick = () => {
      clickModel = !clickModel;

      if (surface && clickModel) {
        displayBlock(containerInput);

        function handleEnterClick() {
          const divName = divNameInput.value;
          const anim = animationNameInput.value;
          const animName = zarboViewer.availableAnimations;

          if (anim.trim() !== "" && animName.includes(anim)) {
            createHotspot(divName, anim, surface);
            outPopup();
          } else {
            outPopup();
            displayBlock(popupError);

            setTimeout(() => {
              displayNone(popupError);
            }, 1500);
          }
        }
        setupEnterButton(enterButton, handleEnterClick);
      }
    };
  }

  function moveHS(event) {
    if (editMode && window.onMoveHotspot) {
      const hotspotElement = event.target;
      const currentSlot = hotspotElement.getAttribute("slot");

      function onMouseMove(moveEvent) {
        let newSur = zarboViewer.surfaceFromPoint(
          moveEvent.clientX,
          moveEvent.clientY
        );

        if (newSur) {
          const updatedSurface = {
            name: currentSlot,
            surface: `${newSur}`,
          };
          console.log(newSur);

          zarboViewer.updateHotspot(updatedSurface);
        }
      }

      document.addEventListener("mousemove", onMouseMove);

      document.addEventListener(
        "mouseup",
        () => {
          document.removeEventListener("mousemove", onMouseMove);
        },
        { once: true }
      );
    }
  }

  function renameDiv(hotspotElement, hotspotAnnotation) {
    displayBlock(containerInput);
    displayNone(animationNameInput);
    setupEnterButton(enterButton, ()=>{
      const newName = divNameInput.value.trim();
      if (newName){
        hotspotAnnotation.textContent = newName;
        hotspotElement.appendChild(hotspotAnnotation);
        const hs = hotspotList.hotspots.find(
          (hs) => hs.animation === hotspotElement.dataset.animation
        );
        if(hs){
          hs.name = newName;
          hotspotList.saveHotspots()
        }
        outPopup()
      }
    })
  }

  function hightlightHS(hotspotElement) {
    if (!hotspotElement.classList.contains("dimmed")) {
      const color = getComputedStyle(hotspotElement)
        .getPropertyValue("--button-color")
        .trim();
      hotspotElement.style.setProperty("--button-color", color);
      hotspotElement.classList.toggle("blink");
    }
  }

  function visibleHS(hotspotElement, hotspotDiv) {
    const visHs = !hotspotElement.classList.toggle("dimmed");
    hotspotDiv.classList.toggle("dimmed");
    if (!visHs) hightlightHS(hotspotElement);
  }

  function removeHS(hotspotElement, hotspotDiv) {
    const name = hotspotDiv.textContent;
    hotspotElement.remove();
    hotspotDiv.remove();
    hotspotList.remove(name);
  }

  async function playAnimation(anim, timeScale) {
    zarboViewer.animationName = anim;
    zarboViewer.timeScale = timeScale;
    await zarboViewer.updateComplete;

    zarboViewer.play({
      repetitions: 1,
      pingpong: false,
    });
  }

  function resetHotspotFlags() {
    window.onRenameHotspot = activeHotspotAction === "rename";
    window.onMoveHotspot = activeHotspotAction === "move";
    window.onHightlightHotspot = activeHotspotAction === "highlight";
    window.onVisibleHotspot = activeHotspotAction === "visible";
    window.onRemoveHotspot = activeHotspotAction === "remove";
  }
})();
//         let allHotspot = document.querySelectorAll('.Hotspot')

//         allHotspot.forEach(hotspot => {
//           hotspot.addEventListener('mousedown', moveHS);
//           createButtonOn = true

//           function moveHS(event) {
//             if (editMode && createButtonOn) {
//               const currentSlot = event.target.getAttribute('slot');
//               console.log(currentSlot);
//               const hotspot = event.target;
//               hotspot.style.zIndex = 1000;

//               let hot = zarboViewer.queryHotspot('hotspot-1')

//               const initialMouseX = event.clientX;
//               const initialMouseY = event.clientY;
//               const initialHotspotX = parseFloat(hotspot.style.left) || 0;
//               const initialHotspotY = parseFloat(hotspot.style.top) || 0;

//               function onMouseMove(e) {
//                 const deltaX = e.clientX - initialMouseX;
//                 const deltaY = e.clientY - initialMouseY;

//                 hotspot.style.left = `${initialHotspotX + deltaX}px`;
//                 hotspot.style.top = `${initialHotspotY + deltaY}px`;
//                 console.log(initialMouseX)
//                 console.log(initialMouseY)
//                 console.log(e.clientX)
//                 console.log(e.clientY)
//                 console.log(deltaX)
//                 console.log(deltaY)
//                 console.log(hotspot.style.left)
//                 console.log(hotspot.style.top)
//                 console.log('-----------------------')
//               }

//               function onMouseUp() {
//                 document.removeEventListener('mousemove', onMouseMove)
//                 document.removeEventListener('mouseup', onMouseUp, createButtonOn = false)
//               }
//               document.addEventListener('mousemove', onMouseMove)
//               document.addEventListener('mouseup', onMouseUp)
//             }
//           }
//         });

//       }
//       enterButton.addEventListener('click', handleEnterClick, { once: true });
//     }
//   }
// };
// ---------------------------------------------------------------------

// function onMouseMove(moveEvent) {

//   let newPos = zarboViewer.positionAndNormalFromPoint(moveEvent.clientX, moveEvent.clientY);
//   const updatedProperties = {
//     name: currentSlot,
//     position: `${newPos.position.x} ${newPos.position.y} ${newPos.position.z}`
//   };
//   let newSur = zarboViewer.surfaceFromPoint(moveEvent.clientX, moveEvent.clientY);
//   console.log(newPos.position)
//   console.log('-----------------------------')
//   console.log(newSur)
//   const updatedSurface = {
//     name: currentSlot,
//     position: `${newSur}`
//   };
//   zarboViewer.updateHotspot(updatedProperties);
//   zarboViewer.updateHotspot(updatedSurface);
// }

// function moveHS(event) {
//   if (editMode) {
//     const hotspot = event.target;
//     const currentSlot = event.target.getAttribute("slot");
//     async function onMouseMove(moveEvent) {
//       const newPos = zarboViewer.positionAndNormalFromPoint(
//         moveEvent.clientX,
//         moveEvent.clientY
//       );
//       if (newPos) {
//         const updatedProperties = {
//           name: currentSlot,
//           position: `${newPos.position.x} ${newPos.position.y} ${newPos.position.z}`,
//         };
//         zarboViewer.updateHotspot(updatedProperties);

//         // hotspot.setAttribute("data-position", `${newPos.position.x}m, ${newPos.position.y}m, ${newPos.position.z}m`);
//         // hotspot.setAttribute("data-normal", `${newPos.normal.x}m, ${newPos.normal.y}m, ${newPos.normal.z}m`);
//         // console.log(`Updated data-surface: ${newPos}`);
//         await zarboViewer.updateComplete;
//       }
//     }

//     function onMouseUp() {
//       document.removeEventListener("mousemove", onMouseMove);
//       document.removeEventListener("mouseup", onMouseUp);
//       saveButtons();
//     }

//     document.addEventListener("mousemove", onMouseMove);
//     document.addEventListener("mouseup", onMouseUp);
//   }
