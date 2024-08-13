class Hotspot{
  constructor(){
  }
  saveButtons() {
    const buttons = [];
    document.querySelectorAll(".Hotspot").forEach((button) => {
      buttons.push({
        text: button.querySelector(".HotspotAnnotation").textContent,
        animation: button.getAttribute("data-animation"),
        data_surface: button.getAttribute("data-surface"),
      });
    });
    localStorage.setItem("buttons", JSON.stringify(buttons));
  }
  renameHS(hotspot, divName){
    const buttons = JSON.parse(localStorage.getItem("buttons")) || [];
    const buttonIndex = Array.from(
      modelViewer.querySelectorAll(".Hotspot")
    ).indexOf(hotspot);
    if (buttonIndex !== -1) {
      buttons[buttonIndex].text = divName;
      localStorage.setItem("buttons", JSON.stringify(buttons));
      console.log(buttons)
    }
  }
}
let editMode = false;
let animNameCreate = [];
const modelViewer = document.querySelector("model-viewer");
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

let hotspotClass = new Hotspot()

const actions = [
  { element: hotspotMove, action: "move" },
  { element: hotspotRename, action: "rename" },
  { element: hotspotHighlight, action: "highlight" },
  { element: hotspotVisible, action: "visible" },
  { element: hotspotRemove, action: "remove" },
];
//======================================================================
document.addEventListener("DOMContentLoaded", () => {
  const buttons = JSON.parse(localStorage.getItem("buttons")) || [];
  buttons.forEach((button) => {
    createHotspot(button.text, button.animation, button.data_surface);
    console.log(button);
  });
});
//======================================================================
actions.forEach(({ element, action }) => {
  element.addEventListener("click", () => {
    activeHotspotAction = action;
    resetHotspotFlags();
    console.log(`Активное действие: ${action}`);
    contextMenu.style.display = 'none'
  });
});
//======================================================================
function setupEnterButton(enterButton, handleClick){
  enterButton.removeEventListener('click', handleClick)
  enterButton.addEventListener('click', handleClick, {once: true})
}
//======================================================================
modelViewer.addEventListener("contextmenu", (event) => {
  event.preventDefault();

  if (!editMode) return;

  const surface = modelViewer.surfaceFromPoint(event.clientX, event.clientY);
  const newPos = modelViewer.positionAndNormalFromPoint(
    event.clientX,
    event.clientY
  );

  if (surface !== null) {
    contextMenu.style.display = "block";
    contextMenu.setAttribute(
      "data-position",
      `${newPos.position.x} ${newPos.position.y} ${newPos.position.z}`
    );
    clickCreateHS(surface);
  }
});
setTimeout(()=>{ console.log(modelViewer.animationName)
  console.log(modelViewer.availableAnimations)}, 5000)

//======================================================================
function createHotspot(text, animationName, surface) {
  const hotspot = document.createElement("button");
  const hotspotDiv = document.createElement("div");

  animNameCreate.push(animationName);
  hotspot.setAttribute("class", "Hotspot");
  hotspot.setAttribute("slot", `hotspot-${animNameCreate.length}`);
  hotspot.setAttribute("data-surface", surface);
  hotspot.setAttribute("data-visibility-attribute", "visible");
  hotspot.setAttribute("data-animation", animationName);
  hotspotDiv.setAttribute("class", "HotspotAnnotation");
  hotspotDiv.textContent = text;
  hotspot.appendChild(hotspotDiv);

  hotspot.addEventListener("click", async () => {
    if (!editMode) {
      playAnimation(animationName, doorCondition ? -1 : 1);
      doorCondition = !doorCondition;
      
      console.log(modelViewer.animationName)
      console.log(modelViewer.availableAnimations)
      // console.log(mode)

    } else {
      switch (activeHotspotAction) {
        case "rename":
          renameDiv(hotspot, hotspotDiv);
          break;
        case "move":
          moveHS(hotspot);
          onMoveHotspot = !onMoveHotspot
          break;
        case "highlight":
          hightlightHS(hotspot);
          break;
        case "visible":
          visibleHS(hotspot, hotspotDiv);
          break;
        case "remove":
          removeHS(hotspot, hotspotDiv);
          break;
        default:
          console.log("Нет активного действия.");
      }
    }
  });
  hotspot.addEventListener("mousedown", moveHS);

  modelViewer.appendChild(hotspot);

  hotspotClass.saveButtons()
}
//======================================================================
function clickCreateHS(surface) {
  hotspotCreate.onclick = () => {
    clickModel = !clickModel;

    if (surface && clickModel) {
      containerInput.style.display = "block";

      function handleEnterClick() {
        const divName = divNameInput.value;
        const anim = animationNameInput.value;
        const animName = modelViewer.availableAnimations;

        if (anim.trim() !== "" && animName.includes(anim)) {
          createHotspot(divName, anim, surface);
          hotspotClass.saveButtons()
          outPopup();
        } else {
          outPopup();
          popupError.style.display = "block";
          setTimeout(() => {
            popupError.style.display = "none";
          }, 1500);
        }
      }
      setupEnterButton(enterButton, handleEnterClick)
    }
  };
}
//======================================================================
function moveHS(event) {
  if (editMode && window.onMoveHotspot) {
    const hotspot = event.target;
    const currentSlot = hotspot.getAttribute("slot");

    function onMouseMove(moveEvent) {
      // let newPos = modelViewer.positionAndNormalFromPoint(moveEvent.clientX, moveEvent.clientY);

      // if (!newPos) return;

      // const updatedProperties = {
      //   name: currentSlot,
      //   position: `${newPos.position.x} ${newPos.position.y} ${newPos.position.z}`,
      // };

      let newSur = modelViewer.surfaceFromPoint(
        moveEvent.clientX,
        moveEvent.clientY
      );

      if (newSur) {
        // hotspot.setAttribute("data-surface", newSur);
        const updatedSurface = {
          name: currentSlot,
          surface: `${newSur}`,
        };

        console.log(newSur);
        // modelViewer.updateHotspot(updatedProperties);
        modelViewer.updateHotspot(updatedSurface);
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
//======================================================================
function renameDiv(hotspot, hotspotDiv) {
  containerInput.style.display = "block";
  divNameInput.value = hotspotDiv.textContent;
  animationNameInput.style.display = "none";

  setupEnterButton(enterButton, hsEnter)

  function hsEnter() {
    if (editMode) {
      const divName = divNameInput.value;
      hotspotDiv.textContent = divName;
      hotspot.appendChild(hotspotDiv);
      animationNameInput.style.display = "block";
      outPopup();
      hotspotClass.renameHS(hotspot, divName)
    }
  }
}
//======================================================================
function hightlightHS(hotspot) {
  if (!hotspot.classList.contains("dimmed")) {
    const color = getComputedStyle(hotspot)
      .getPropertyValue("--button-color")
      .trim();
    hotspot.style.setProperty("--button-color", color);
    hotspot.classList.toggle("blink");
  }
}
//======================================================================
function visibleHS(hotspot, hotspotDiv) {
  const visHs = !hotspot.classList.toggle("dimmed");
  hotspotDiv.classList.toggle("dimmed");
  if (!visHs) hightlightHS(hotspot);
}
//======================================================================
function removeHS(hotspot, hotspotDiv) {
  hotspot.remove();
  hotspotDiv.remove();
  hotspotClass.saveButtons()
}
//======================================================================
async function playAnimation(anim, timeScale) {
  modelViewer.animationName = anim;
  modelViewer.timeScale = timeScale;
  await modelViewer.updateComplete;

  modelViewer.play({
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

editButton.addEventListener("click", (event) => {
  event.stopPropagation();
  editMode = !editMode;
  if (editMode) {
    clickModel = false;
    activeHotspotAction = null;
    resetHotspotFlags();
  }
  if (editMode) {
    popupOn.style.display = "block";
    setTimeout(() => {
      popupOn.style.display = "none";
    }, 1500);
  } else {
    popupOff.style.display = "block";
    setTimeout(() => {
      popupOff.style.display = "none";
    }, 1000);
  }
});

cancelButton.addEventListener("click", outPopup);

function outPopup() {
  divNameInput.value = "";
  animationNameInput.value = "";
  containerInput.style.display = "none";
  contextMenu.style.display = "none";
}
// ------------------------Анимация загрузки-------------------------
const loadPromises = [
  new Promise((resolve, reject) => {
    modelViewer.addEventListener("load", () => {
      resolve();
    });
    modelViewer.addEventListener("error", (error) => {
      reject(error);
    });
  }),
];

Promise.all(loadPromises).then(() => {
  loader.style.display = "none";
});
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

//               let hot = modelViewer.queryHotspot('hotspot-1')

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

//   let newPos = modelViewer.positionAndNormalFromPoint(moveEvent.clientX, moveEvent.clientY);
//   const updatedProperties = {
//     name: currentSlot,
//     position: `${newPos.position.x} ${newPos.position.y} ${newPos.position.z}`
//   };
//   let newSur = modelViewer.surfaceFromPoint(moveEvent.clientX, moveEvent.clientY);
//   console.log(newPos.position)
//   console.log('-----------------------------')
//   console.log(newSur)
//   const updatedSurface = {
//     name: currentSlot,
//     position: `${newSur}`
//   };
//   modelViewer.updateHotspot(updatedProperties);
//   modelViewer.updateHotspot(updatedSurface);
// }

// function moveHS(event) {
//   if (editMode) {
//     const hotspot = event.target;
//     const currentSlot = event.target.getAttribute("slot");
//     async function onMouseMove(moveEvent) {
//       const newPos = modelViewer.positionAndNormalFromPoint(
//         moveEvent.clientX,
//         moveEvent.clientY
//       );
//       if (newPos) {
//         const updatedProperties = {
//           name: currentSlot,
//           position: `${newPos.position.x} ${newPos.position.y} ${newPos.position.z}`,
//         };
//         modelViewer.updateHotspot(updatedProperties);

//         // hotspot.setAttribute("data-position", `${newPos.position.x}m, ${newPos.position.y}m, ${newPos.position.z}m`);
//         // hotspot.setAttribute("data-normal", `${newPos.normal.x}m, ${newPos.normal.y}m, ${newPos.normal.z}m`);
//         // console.log(`Updated data-surface: ${newPos}`);
//         await modelViewer.updateComplete;
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
