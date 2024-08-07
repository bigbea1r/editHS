// document.addEventListener('DOMContentLoaded', function() {
//   // Инициализация Pickr
//   const pickr = Pickr.create({
//       el: '#color-picker-container',
//       theme: 'nano', // можно использовать 'monolith' или 'nano' 'classic'
//       default: '#ffffff', // начальный цвет
//       // swatches: [
//       //     '#000000', '#FF0000', '#00FF00', '#0000FF', // Предустановленные цвета
//       //     // Добавьте больше цветов, если нужно
//       // ],
//       components: {
//           preview: true,
//           opacity: true,
//           hue: true,
//           interaction: {hex: true, rgb: true, input: true, alpha: true, cancel: true, save: true}
//       }
//   });

//   // Обработка выбора цвета
//   pickr.on('save', (color) => {
//       const rgbaColor = color.toRGBA(); // Получаем цвет в формате rgba
//       if (currentHotspot) {
//           // Устанавливаем выбранный цвет для текущего hotspot
//           currentHotspot.style.setProperty('--button-color', `rgba(${rgbaColor[0]}, ${rgbaColor[1]}, ${rgbaColor[2]}, ${rgbaColor[3]})`);
//       }
//       pickr.hide(); // Скрыть Pickr после выбора цвета
//   });

//   // Скрыть Pickr при клике вне его
//   document.addEventListener('click', (event) => {
//       if (!pickr.getRoot().contains(event.target)) {
//           pickr.hide();
//       }
//   });
// });


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

// const colorChange = document.getElementById("colorChangeHotspot");

let mainColor = "#FFFFFF";

let doorCondition = false;
let clickModel = false;
let onRenameHotspot = false;
let onMoveHotspot = false;
let onHightlightHotspot = false;
let onVisibleHotspot = false;
let onRemoveHotspot = false;
let onColorHotspot = false;

let intervalId = null;
let currentHotspot = null; // Хранит текущий hotspot для изменения цвета
// let originalColor = null;

let visHs = false;

document.addEventListener("DOMContentLoaded", () => {
  const buttons = JSON.parse(localStorage.getItem("buttons")) || [];
  buttons.forEach((button) => {
    // const position = button.position.split(" ").map(Number);
    // const newPos = {
    //   position: { x: position[0], y: position[1], z: position[2] },
    // };
    createHotspot(button.animation, button.surface, button.text);
    console.log(button);
  });
});
// function switchingLogic(buttonFuc, varLogic){
//   console.log(1)
//   buttonFuc.onclick = () => {
//     console.log(2)
//     varLogic = !varLogic;
//     console.log("varLogic =" + varLogic);
//     contextMenu.style.display = "none";
//   };
// }
//======================================================================
modelViewer.addEventListener("contextmenu", (event) => {
  event.preventDefault();
  if (editMode) {
    const surface = modelViewer.surfaceFromPoint(event.clientX, event.clientY);
    const newPos = modelViewer.positionAndNormalFromPoint(event.clientX, event.clientY);
    if (surface !== null) {
      contextMenu.style.display = "block";
      contextMenu.setAttribute(
        "data-position",
        `${newPos.position.x} ${newPos.position.y} ${newPos.position.z}`
      );
      const toggleState = (property) => {
        window[property] = !window[property];
        console.log(`${property} = ${window[property]}`);
        contextMenu.style.display = "none";
      };
    
      const buttonActions = {
        hotspotMove: 'onMoveHotspot',
        hotspotRename: 'onRenameHotspot',
        hotspotHighlight: 'onHightlightHotspot',
        hotspotVisible: 'onVisibleHotspot',
        hotspotRemove: 'onRemoveHotspot'
      };
      // colorChange.onclick = () => {
      //   onColorHotspot = !onColorHotspot;
      //   console.log("onColorHotspot =" + onColorHotspot);
      //   contextMenu.style.display = "none";
      // };
      Object.entries(buttonActions).forEach(([buttonId, stateProperty]) => {
        document.getElementById(buttonId).onclick = () => toggleState(stateProperty);
      });
    }
    clickCreateHS(surface);
  }
});
//======================================================================
function createHotspot(animationName, surface, text) {
  const hotspot = document.createElement("button");
  const hotspotDiv = document.createElement("div");

  animNameCreate.push(animationName);
  hotspot.setAttribute("class", "Hotspot");
  hotspot.setAttribute("slot", `hotspot-${animNameCreate.length}`);
  // hotspot.setAttribute(
  //   "data-position",
  //   `${newPos.position.x} ${newPos.position.y} ${newPos.position.z}`
  // );
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
    } else {
      renameDiv(hotspot, hotspotDiv);
      hightlightHS(hotspot, hotspotDiv);
      visibleHS(hotspot, hotspotDiv);
      removeHS(hotspot, hotspotDiv);
      // colorChangeHS(hotspot);
    }
  });
  hotspot.addEventListener("mousedown", moveHS);

  modelViewer.appendChild(hotspot);

  saveButtons();
}

//======================================================================
function clickCreateHS(surface) {
  hotspotCreate.onclick = () => {
    clickModel = !clickModel;

    if (surface && clickModel) {
      containerInput.style.display = "block";
      enterButton.removeEventListener("click", handleEnterClick);

      function handleEnterClick() {
        const divName = divNameInput.value;
        const anim = animationNameInput.value;
        const animName = modelViewer.availableAnimations;

        if (anim.trim() !== "" && animName.includes(anim)) {
          createHotspot(anim, surface, divName);
          saveButtons(surface);
          outPopup();
        } else {
          outPopup();
          popupError.style.display = "block";
          setTimeout(() => {
            popupError.style.display = "none";
          }, 1500);
        }
      }

      enterButton.addEventListener("click", handleEnterClick, {
        once: true,
      });
    }
  };
}
//======================================================================

function moveHS(event) {
  if (editMode && onMoveHotspot) {
    const hotspot = event.target;
    const currentSlot = event.target.getAttribute("slot");
    async function onMouseMove(moveEvent) {
      // let newPos = modelViewer.positionAndNormalFromPoint(
      //   moveEvent.clientX,
      //   moveEvent.clientY
      // );
      // const updatedProperties = {
      //   name: currentSlot,
      //   position: `${newPos.position.x} ${newPos.position.y} ${newPos.position.z}`,
      // };
      let newSur = modelViewer.surfaceFromPoint(
        moveEvent.clientX,
        moveEvent.clientY
      );
      // console.log("-----------------------------");
      // console.log(newSur);
      await modelViewer.updateComplete;
      hotspot.setAttribute("data-surface", newSur);
      const updatedSurface = {
        name: currentSlot,
        surface: `${newSur}`,
      };
      console.log("-----------------------------");
      console.log(modelViewer.queryHotspot(currentSlot).position);
      console.log(modelViewer.queryHotspot(currentSlot).normal);
      console.log(modelViewer.queryHotspot(currentSlot).canvasPosition);
      // modelViewer.updateHotspot(updatedProperties);
      modelViewer.updateHotspot(updatedSurface);
    }
    function onMouseUp() {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      saveButtons();
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }
}

//======================================================================
function renameDiv(hotspot, hotspotDiv) {
  if (editMode && onRenameHotspot) {
    containerInput.style.display = "block";
    divNameInput.value = hotspotDiv.textContent;
    animationNameInput.style.display = "none";

    enterButton.addEventListener("click", hsEnter, { once: true });
    function hsEnter() {
      if (editMode) {
        const divName = divNameInput.value;
        hotspotDiv.textContent = divName;
        hotspot.appendChild(hotspotDiv);
        animationNameInput.style.display = "block";
        outPopup();

        const buttons = JSON.parse(localStorage.getItem("buttons")) || [];
        const buttonIndex = Array.from(
          modelViewer.querySelectorAll(".Hotspot")
        ).indexOf(hotspot);
        if (buttonIndex !== -1) {
          buttons[buttonIndex].text = divName;
          localStorage.setItem("buttons", JSON.stringify(buttons));
        }
      }
    }
  }
}
//======================================================================
function hightlightHS(hotspot) {
  if (editMode && onHightlightHotspot) {
      function setButtonColor(color) {
          hotspot.style.setProperty("--button-color", color);
      }

      function toggleBlinking() {
          hotspot.classList.toggle("blink");
      }

      // Устанавливаем текущий цвет кнопки, который сохранен в CSS переменной
      const currentColor = getComputedStyle(hotspot).getPropertyValue("--button-color").trim();
      setButtonColor(currentColor);

      hotspot.addEventListener("click", toggleBlinking);
  }
}
//======================================================================
// function colorChangeHS(hotspot) {
//   if (editMode && onColorHotspot) {
//     currentHotspot = hotspot;
//     const pickr = Pickr.get('#color-picker-container');
//     pickr.show();
//       // hotspot.style.setProperty("--button-color", "#000000");
//   }
// }
//======================================================================
function visibleHS(hotspot, hotspotDiv) {
  if (editMode) {
    if (onVisibleHotspot) {
      visHs = !visHs;
      if (visHs) {
        onHightlightHotspot = false;

        hotspot.classList.add("dimmed");
        hotspotDiv.classList.add("dimmed");
      } else {
        hotspot.classList.remove("dimmed");
        hotspotDiv.classList.remove("dimmed");
      }
    }
  }
}
//======================================================================
// Функция удаления тоже не совсем корректно работает с localStorage. нужно удалять конкретный hotspot при включенном флаге и
function removeHS(hotspot, hotspotDiv) {
  if (editMode) {
    if (editMode && onRemoveHotspot) {
      hotspot.remove();
      hotspotDiv.remove();
      let removeButtons = localStorage.getItem("text");
      console.log(localStorage);
      console.log(removeButtons);
    }
  }
}
//======================================================================
function saveButtons() {
  const buttons = [];
  document.querySelectorAll(".Hotspot").forEach((button) => {
    buttons.push({
      animation: button.getAttribute("data-animation"),
      surface: button.getAttribute("data-surface"),
      // position: button.getAttribute("data-position"),
      // normal: button.getAttribute("data-normal"),
      text: button.querySelector(".HotspotAnnotation").textContent,
    });
  });
  localStorage.setItem("buttons", JSON.stringify(buttons));
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
editButton.addEventListener("click", (event) => {
  event.stopPropagation();
  editMode = !editMode;
  if (editMode) {
    clickModel = false;
    onRenameHotspot = false;
    onMoveHotspot = false;
    onHightlightHotspot = false;
    onVisibleHotspot = false;
    onRemoveHotspot = false;
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
  // document.querySelectorAll("button").forEach((button) => {
  //   button.style.display = "block";
  // });
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
