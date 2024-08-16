(async function initialize() {
  const ZV = new ZarboViewer('.zarbo_widget', '49b7a8e2-994b-4a51-af7a-e2af12aa738c', 'https://api-release36v2.zarbo.works');
  await ZV.init();

  class Hotspot {
    constructor(name, animation, data_surface) {
      this.name = name;
      this.animation = animation;
      this.data_surface = data_surface;
    }
  }

  class HotspotList {
    constructor() {
      this.hotspots = [];
    }

    add(hotspot, shouldSave = true) {

      this.hotspots.push(hotspot);
      if (shouldSave) {

        this.saveHotspots();
      }
    }

    remove(name) {
      this.hotspots = this.hotspots.filter((hs) => hs.name !== name);
      this.saveHotspots();
    }

    getByName(name) {
      return this.hotspots.find((hs) => hs.name === name);
    }

    setByName(oldName, newName) {
      const hotspot = this.getByName(oldName);
      if (hotspot) {
        hotspot.name = newName;
        this.saveHotspots();
      }
    }

    saveHotspots() {
      localStorage.setItem("hotspots", JSON.stringify(this.hotspots));
    }

    loadHotspots() {
      const loadedHotspots = JSON.parse(localStorage.getItem("hotspots")) || [];
      this.hotspots = loadedHotspots.map(
        (hs) => new Hotspot(hs.name, hs.animation, hs.data_surface)
      );
      console.log(localStorage)
      console.log(loadedHotspots)
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
      createHotspot(hotspot.name, hotspot.animation, hotspot.data_surface, false);
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
            renameDiv(hotspotElement, hotspotElement.querySelector(".HotspotAnnotation"));
            break;
          case "move":
            moveHS(hotspotElement);
            onMoveHotspot = !onMoveHotspot;
            break;
          case "highlight":
            hightlightHS(hotspotElement);
            break;
          case "visible":
            visibleHS(hotspotElement, hotspotElement.querySelector(".HotspotAnnotation"));
            break;
          case "remove":
            removeHS(hotspotElement, hotspotElement.querySelector(".HotspotAnnotation"));
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

  function renameDiv(hotspotElement, hotspotDiv, shouldSave = true) {
    displayBlock(containerInput);
    divNameInput.value = hotspotDiv.textContent;
    displayNone(animationNameInput);

    setupEnterButton(enterButton, hsEnter);

    function hsEnter() {
      if (editMode) {
        const oldName = hotspotDiv.textContent;
        const newName = divNameInput.value;
        hotspotDiv.textContent = newName;
        hotspotElement.appendChild(hotspotDiv);
        displayBlock(animationNameInput);
        outPopup();
        hotspotList.setByName(oldName, newName, shouldSave);
      }
    }
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
