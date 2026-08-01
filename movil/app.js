const INITIAL_VALUES = [50, 30, 70, 20, 40, 60, 80];
const MAX_NODES = 15;
const STEP_DELAY = 700;

const state = {
  root: null,
  selectedValue: 50,
  mode: "explore",
  nodes: new Map(),
  positions: new Map(),
  labels: [],
  timers: [],
  isAnimating: false,
  treeGroup: null,
  scene: null,
  zoom: 1,
  rotationY: 0,
  audioContext: null,
  soundEnabled: true,
};

const els = {
  sceneHost: document.querySelector("#sceneHost"),
  modeLabel: document.querySelector("#modeLabel"),
  statusMessage: document.querySelector("#statusMessage"),
  startArButton: document.querySelector("#startArButton"),
  exitArButton: document.querySelector("#exitArButton"),
  exploreButton: document.querySelector("#exploreButton"),
  controlsToggle: document.querySelector("#controlsToggle"),
  controlsBody: document.querySelector("#controlsBody"),
  educationToggle: document.querySelector("#educationToggle"),
  educationPanel: document.querySelector(".education-panel"),
  educationBody: document.querySelector("#educationBody"),
  insertForm: document.querySelector("#insertForm"),
  insertValue: document.querySelector("#insertValue"),
  clearInsert: document.querySelector("#clearInsert"),
  searchForm: document.querySelector("#searchForm"),
  searchValue: document.querySelector("#searchValue"),
  eduOperation: document.querySelector("#eduOperation"),
  eduDefinition: document.querySelector("#eduDefinition"),
  eduRule: document.querySelector("#eduRule"),
  eduCurrent: document.querySelector("#eduCurrent"),
  eduPartial: document.querySelector("#eduPartial"),
  eduSequence: document.querySelector("#eduSequence"),
  eduPseudo: document.querySelector("#eduPseudo code"),
  soundToggle: document.querySelector("#soundToggle"),
  qrCode: document.querySelector("#qrCode"),
  qrFallback: document.querySelector("#qrFallback"),
  hamburgerBtn: document.querySelector("#hamburgerBtn"),
  overlay: document.querySelector("#overlay"),
  controlPanel: document.querySelector("#controlPanel"),
};

class TreeNode {
  constructor(value, depth = 0) {
    this.value = value;
    this.left = null;
    this.right = null;
    this.depth = depth;
  }
}

function boot() {
  resetTree();
  createScene("explore");
  bindEvents();
  configureResponsiveDefaults();
  updateEducation({
    operation: "Exploración del árbol",
    definition: "Un árbol binario de búsqueda organiza valores comparando cada nodo con sus descendientes.",
    rule: "Los valores menores van al subárbol izquierdo y los mayores al derecho.",
    current: "Nodo raíz: 50",
    partial: "Árbol inicial cargado.",
    sequence: INITIAL_VALUES.join(", "),
    pseudo: `insertar(valor):
  si árbol está vacío, crear raíz
  si valor < nodo, avanzar a izquierdo
  si valor > nodo, avanzar a derecho`,
  });
  drawQr();
}

function configureResponsiveDefaults() {
  if (!window.matchMedia("(min-width: 920px)").matches) {
    els.controlsToggle.setAttribute("aria-expanded", "false");
    els.controlsBody.classList.add("hidden");
  }
}

function bindEvents() {
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    unlockAudio();
    const action = button.dataset.action;
    if (action === "root") showRoot();
    if (action === "children") showChildren();
    if (action === "leaves") showLeaves();
    if (action === "reset") resetAll();
    if (action === "preorder") runTraversal("preorder");
    if (action === "inorder") runTraversal("inorder");
    if (action === "postorder") runTraversal("postorder");
  });

  els.insertForm.addEventListener("submit", (event) => {
    event.preventDefault();
    unlockAudio();
    insertValue(readIntegerInput(els.insertValue, "insertar"));
  });

  els.searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    unlockAudio();
    searchValue(readIntegerInput(els.searchValue, "buscar"));
  });

  els.clearInsert.addEventListener("click", () => {
    els.insertValue.value = "";
    els.insertValue.focus();
  });

  els.startArButton.addEventListener("click", startAr);
  els.exitArButton.addEventListener("click", () => createScene("explore"));
  els.exploreButton.addEventListener("click", () => createScene("explore"));
  els.soundToggle.addEventListener("click", () => {
    state.soundEnabled = !state.soundEnabled;
    unlockAudio();
    els.soundToggle.textContent = state.soundEnabled ? "Sonido activado" : "Sonido desactivado";
    els.soundToggle.setAttribute("aria-pressed", String(state.soundEnabled));
  });

  els.controlsToggle.addEventListener("click", () => {
    const isOpen = els.controlsToggle.getAttribute("aria-expanded") === "true";
    els.controlsToggle.setAttribute("aria-expanded", String(!isOpen));
    els.controlsBody.classList.toggle("hidden", isOpen);
  });

  els.educationToggle.addEventListener("click", () => {
    const isOpen = els.educationToggle.getAttribute("aria-expanded") === "true";
    els.educationToggle.setAttribute("aria-expanded", String(!isOpen));
    els.educationPanel.classList.toggle("open", !isOpen);
  });

  els.hamburgerBtn.addEventListener("click", () => {
    const isOpen = els.hamburgerBtn.getAttribute("aria-expanded") === "true";
    els.hamburgerBtn.setAttribute("aria-expanded", String(!isOpen));
    els.controlPanel.classList.toggle("open", !isOpen);
    els.overlay.classList.toggle("active", !isOpen);
  });

  els.overlay.addEventListener("click", () => {
    els.hamburgerBtn.setAttribute("aria-expanded", "false");
    els.controlPanel.classList.remove("open");
    els.overlay.classList.remove("active");
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.mode === "ar") createScene("explore");
  });
}

function resetTree() {
  state.root = null;
  INITIAL_VALUES.forEach((value) => {
    state.root = insertNode(state.root, value);
  });
  state.selectedValue = 50;
}

function insertNode(root, value, depth = 0) {
  if (!root) return new TreeNode(value, depth);
  if (value < root.value) root.left = insertNode(root.left, value, depth + 1);
  if (value > root.value) root.right = insertNode(root.right, value, depth + 1);
  root.depth = depth;
  return root;
}

function createScene(mode, isArReady = false) {
  clearTimers();
  state.mode = mode;
  document.body.classList.toggle("ar-mode", mode === "ar");
  state.zoom = 1;
  state.rotationY = 0;
  els.sceneHost.replaceChildren();
  els.modeLabel.textContent = mode === "ar" ? "Realidad aumentada" : "Explorar en 3D";
  els.startArButton.classList.toggle("hidden", mode === "ar");
  els.exitArButton.classList.toggle("hidden", mode !== "ar");
  els.exploreButton.classList.toggle("hidden", mode !== "ar");
  els.statusMessage.textContent =
    mode === "ar"
      ? "Apunta la cámara al marcador Hiro; el árbol aparecerá sobre él."
      : "Arrastra para rotar, usa rueda o gestos para acercar.";

  const scene = document.createElement("a-scene");
  scene.setAttribute("embedded", "");
  scene.setAttribute("renderer", "antialias: true; colorManagement: true; physicallyCorrectLights: true");
  scene.setAttribute("vr-mode-ui", "enabled: false");
  scene.setAttribute("loading-screen", "enabled: false");
  scene.setAttribute("keyboard-shortcuts", "enterVR: false");

  if (mode === "ar" && isArReady) {
    scene.setAttribute("arjs", "sourceType: webcam; facingMode: environment; debugUIEnabled: false");
  } else if (mode !== "ar") {
    scene.setAttribute("background", "color: #dfe9e2");
  }

  els.sceneHost.append(scene);
  state.scene = scene;

  if (mode === "ar" && isArReady) {
    const marker = document.createElement("a-marker");
    marker.setAttribute("preset", "hiro");
    marker.append(createTreeEntity(true));
    scene.append(marker, createCamera(true));
  } else if (mode !== "ar") {
    scene.append(createLights(), createTreeEntity(false), createCamera(false));
    setupExploreGestures();
  }

  renderTree();
}

function createCamera(isAr) {
  const camera = document.createElement("a-entity");
  camera.setAttribute("camera", "");
  camera.setAttribute("cursor", "rayOrigin: mouse; fuse: false");
  camera.setAttribute("raycaster", "objects: .clickable");
  if (!isAr) {
    camera.setAttribute("position", "0 1.45 7.2");
    camera.setAttribute("look-controls", "enabled: false");
  }
  return camera;
}

function createLights() {
  const group = document.createElement("a-entity");
  const ambient = document.createElement("a-entity");
  ambient.setAttribute("light", "type: ambient; intensity: 0.72");
  const key = document.createElement("a-entity");
  key.setAttribute("light", "type: directional; intensity: 0.82");
  key.setAttribute("position", "-2 4 4");
  group.append(ambient, key);
  return group;
}

function createTreeEntity(isAr) {
  const group = document.createElement("a-entity");
  group.id = "treeGroup";
  group.setAttribute("position", isAr ? "0 0.12 0" : "0 -1.05 0");
  group.setAttribute("scale", isAr ? "0.8 0.8 0.8" : "1 1 1");
  if (isAr) group.setAttribute("rotation", "-90 0 0");
  state.treeGroup = group;
  return group;
}

function setupExploreGestures() {
  let dragging = false;
  let lastX = 0;
  els.sceneHost.onpointerdown = (event) => {
    dragging = true;
    lastX = event.clientX;
    els.sceneHost.setPointerCapture(event.pointerId);
  };
  els.sceneHost.onpointermove = (event) => {
    if (!dragging || !state.treeGroup) return;
    state.rotationY += (event.clientX - lastX) * 0.35;
    lastX = event.clientX;
    state.treeGroup.setAttribute("rotation", `0 ${state.rotationY} 0`);
  };
  els.sceneHost.onpointerup = () => {
    dragging = false;
  };
  els.sceneHost.onwheel = (event) => {
    event.preventDefault();
    state.zoom = clamp(state.zoom + (event.deltaY > 0 ? -0.08 : 0.08), 0.64, 1.6);
    state.treeGroup.setAttribute("scale", `${state.zoom} ${state.zoom} ${state.zoom}`);
  };
}

function renderTree() {
  if (!state.treeGroup) return;
  state.nodes.clear();
  state.positions = calculatePositions();
  state.treeGroup.replaceChildren();
  state.labels = [];

  traverse(state.root, (node) => {
    if (node.left) state.treeGroup.append(createEdge(node, node.left));
    if (node.right) state.treeGroup.append(createEdge(node, node.right));
  });

  traverse(state.root, (node) => {
    const entity = createNodeEntity(node);
    state.nodes.set(node.value, entity);
    state.treeGroup.append(entity);
  });
}

function calculatePositions() {
  const ordered = [];
  inorder(state.root, ordered);
  const positions = new Map();
  ordered.forEach((node, index) => {
    const x = (index - (ordered.length - 1) / 2) * 0.82;
    const y = 2.55 - node.depth * 0.92;
    positions.set(node.value, { x, y, z: 0 });
  });
  return positions;
}

function createNodeEntity(node) {
  const position = state.positions.get(node.value);
  const wrapper = document.createElement("a-entity");
  wrapper.setAttribute("position", `${position.x} ${position.y} ${position.z}`);
  wrapper.setAttribute("data-value", String(node.value));
  wrapper.setAttribute("class", "clickable");

  const sphere = document.createElement("a-sphere");
  sphere.setAttribute("radius", "0.23");
  sphere.setAttribute("color", node.value === state.selectedValue ? "#276ef1" : "#0d7c66");
  sphere.setAttribute("metalness", "0.08");
  sphere.setAttribute("roughness", "0.42");

  const label = document.createElement("a-text");
  label.setAttribute("value", String(node.value));
  label.setAttribute("align", "center");
  label.setAttribute("anchor", "center");
  label.setAttribute("baseline", "center");
  label.setAttribute("color", "#ffffff");
  label.setAttribute("width", "2.6");
  label.setAttribute("position", "0 0 0.24");

  wrapper.append(sphere, label);
  wrapper.addEventListener("click", () => selectNode(node.value));
  wrapper.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") selectNode(node.value);
  });
  return wrapper;
}

function createEdge(parent, child) {
  const a = state.positions.get(parent.value);
  const b = state.positions.get(child.value);
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: 0 };
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.hypot(dx, dy);
  const angle = (Math.atan2(dx, dy) * 180) / Math.PI;
  const cylinder = document.createElement("a-cylinder");
  cylinder.setAttribute("radius", "0.035");
  cylinder.setAttribute("height", String(length));
  cylinder.setAttribute("position", `${mid.x} ${mid.y} -0.02`);
  cylinder.setAttribute("rotation", `0 0 ${-angle}`);
  cylinder.setAttribute("color", "#42564b");
  return cylinder;
}

function selectNode(value) {
  state.selectedValue = value;
  clearHighlights();
  highlight(value, "#276ef1");
  const node = findNode(state.root, value);
  updateEducation({
    operation: "Selección de nodo",
    definition: "Un nodo almacena un valor y puede tener como máximo dos hijos.",
    rule: "Desde este nodo se pueden inspeccionar sus hijos izquierdo y derecho.",
    current: `Nodo seleccionado: ${value}`,
    partial: childSummary(node),
    sequence: "Selecciona Hijos para etiquetar sus descendientes directos.",
    pseudo: `seleccionar(nodo):
  marcar nodo
  leer hijo izquierdo
  leer hijo derecho`,
  });
}

function showRoot() {
  clearTimers();
  clearHighlights();
  state.selectedValue = state.root.value;
  highlight(state.root.value, "#f0b429");
  addFloatingLabel(state.root.value, "Nodo raíz");
  updateEducation({
    operation: "Identificar nodo raíz",
    definition: "Es el primer nodo del árbol y no tiene padre.",
    rule: "Todas las búsquedas, inserciones y recorridos comienzan desde la raíz.",
    current: `Nodo actual: ${state.root.value}`,
    partial: "La raíz del árbol inicial es 50.",
    sequence: String(state.root.value),
    pseudo: `raíz(árbol):
  devolver árbol.raíz`,
  });
}

function showChildren() {
  clearTimers();
  clearHighlights();
  const node = findNode(state.root, state.selectedValue) || state.root;
  highlight(node.value, "#276ef1");
  const parts = [];
  if (node.left) {
    highlight(node.left.value, "#f0b429");
    addFloatingLabel(node.left.value, "Hijo izquierdo");
    parts.push(`hijo izquierdo: ${node.left.value}`);
  }
  if (node.right) {
    highlight(node.right.value, "#f0b429");
    addFloatingLabel(node.right.value, "Hijo derecho");
    parts.push(`hijo derecho: ${node.right.value}`);
  }
  if (!node.left) parts.push("no tiene hijo izquierdo");
  if (!node.right) parts.push("no tiene hijo derecho");
  updateEducation({
    operation: "Identificar hijos",
    definition: "Los hijos son nodos conectados directamente por debajo de un nodo padre.",
    rule: "El hijo izquierdo contiene valores menores; el derecho, valores mayores.",
    current: `Nodo seleccionado: ${node.value}`,
    partial: parts.join("; "),
    sequence: parts.join(", "),
    pseudo: `hijos(nodo):
  revisar nodo.izquierdo
  revisar nodo.derecho
  etiquetar los hijos existentes`,
  });
}

function showLeaves() {
  clearTimers();
  clearHighlights();
  const leaves = [];
  traverse(state.root, (node) => {
    if (!node.left && !node.right) leaves.push(node.value);
  });
  leaves.forEach((value) => {
    highlight(value, "#f0b429");
    addFloatingLabel(value, "Hoja");
  });
  updateEducation({
    operation: "Identificar nodos hoja",
    definition: "Los nodos hoja no tienen descendientes.",
    rule: "Un nodo es hoja cuando no posee hijo izquierdo ni hijo derecho.",
    current: "Todos los nodos fueron evaluados.",
    partial: `Hojas encontradas: ${leaves.join(", ")}.`,
    sequence: leaves.join(", "),
    pseudo: `esHoja(nodo):
  si nodo.izquierdo es vacío y nodo.derecho es vacío
    marcar como hoja`,
  });
}

async function insertValue(value) {
  if (value === null) return;
  if (countNodes(state.root) >= MAX_NODES) return announceError("El árbol está limitado a 15 nodos para conservar la legibilidad.");
  if (findNode(state.root, value)) return announceError("No se permiten valores duplicados en este árbol.");

  disableControls(true);
  clearTimers();
  clearHighlights();
  const path = [];
  let current = state.root;
  let parent = null;
  let direction = "";
  while (current) {
    path.push(current.value);
    parent = current;
    direction = value < current.value ? "izquierdo" : "derecho";
    await animateStep(current.value, {
      operation: "Insertar valor",
      definition: "La inserción ubica un nuevo valor respetando el orden del árbol binario de búsqueda.",
      rule: `${value} es ${value < current.value ? "menor" : "mayor"} que ${current.value}; avanzar al hijo ${direction}.`,
      current: `Comparando con ${current.value}`,
      partial: `Camino: ${path.join(" → ")}`,
      sequence: "En progreso.",
      pseudo: `insertar(${value}):
  comparar con nodo actual
  si es menor, ir a izquierdo
  si es mayor, ir a derecho`,
    });
    current = value < current.value ? current.left : current.right;
  }

  if (value < parent.value) parent.left = new TreeNode(value, parent.depth + 1);
  else parent.right = new TreeNode(value, parent.depth + 1);
  normalizeDepths(state.root);
  state.selectedValue = value;
  renderTree();
  highlight(value, "#f0b429");
  addFloatingLabel(value, "Nuevo nodo");
  updateEducation({
    operation: "Insertar valor",
    definition: "El nuevo nodo se agrega en la primera posición vacía encontrada por comparación.",
    rule: `Se insertó como hijo ${direction} de ${parent.value}.`,
    current: `Nuevo nodo: ${value}`,
    partial: `Camino final: ${path.join(" → ")} → ${value}`,
    sequence: inorderValues().join(", "),
    pseudo: `insertar(${value}):
  repetir comparaciones desde la raíz
  crear nodo en el enlace vacío`,
  });
  els.insertValue.value = "";
  disableControls(false);
}

async function searchValue(value) {
  if (value === null) return;
  disableControls(true);
  clearTimers();
  clearHighlights();
  let current = state.root;
  const path = [];
  while (current) {
    path.push(current.value);
    if (current.value === value) {
      await animateStep(current.value, {
        operation: "Buscar elemento",
        definition: "La búsqueda compara el valor objetivo desde la raíz hasta encontrarlo o llegar a un enlace vacío.",
        rule: `${value} es igual a ${current.value}.`,
        current: `Nodo actual: ${current.value}`,
        partial: `Camino: ${path.join(" → ")}`,
        sequence: "Elemento encontrado.",
        pseudo: `buscar(${value}):
  si valor == nodo.valor
    devolver encontrado`,
      });
      highlight(current.value, "#f0b429");
      addFloatingLabel(current.value, "Elemento encontrado");
      disableControls(false);
      return;
    }
    const direction = value < current.value ? "izquierdo" : "derecho";
    await animateStep(current.value, {
      operation: "Buscar elemento",
      definition: "La búsqueda descarta subárboles completos usando el orden del árbol.",
      rule: `${value} es ${value < current.value ? "menor" : "mayor"} que ${current.value}; avanzar al hijo ${direction}.`,
      current: `Nodo actual: ${current.value}`,
      partial: `Camino: ${path.join(" → ")}`,
      sequence: "En progreso.",
      pseudo: `buscar(${value}):
  comparar con nodo actual
  elegir izquierdo o derecho`,
    });
    current = value < current.value ? current.left : current.right;
  }
  clearHighlights();
  updateEducation({
    operation: "Buscar elemento",
    definition: "La búsqueda termina sin éxito al llegar a una posición vacía.",
    rule: "No existe un enlace por el cual continuar.",
    current: "Enlace vacío.",
    partial: `Camino recorrido: ${path.join(" → ")}`,
    sequence: "El elemento no pertenece al árbol.",
    pseudo: `buscar(${value}):
  si nodo es vacío
    devolver no encontrado`,
  });
  disableControls(false);
}

async function runTraversal(type) {
  disableControls(true);
  clearTimers();
  clearHighlights();
  const sequence = [];
  if (type === "preorder") preorder(state.root, sequence);
  if (type === "inorder") inorder(state.root, sequence);
  if (type === "postorder") postorder(state.root, sequence);
  const names = {
    preorder: "Preorden",
    inorder: "Inorden",
    postorder: "Posorden",
  };
  const rules = {
    preorder: "Raíz → subárbol izquierdo → subárbol derecho.",
    inorder: "Subárbol izquierdo → raíz → subárbol derecho.",
    postorder: "Subárbol izquierdo → subárbol derecho → raíz.",
  };
  const partial = [];
  for (const node of sequence) {
    partial.push(node.value);
    await animateStep(node.value, {
      operation: `Recorrido en ${names[type].toLowerCase()}`,
      definition: "Un recorrido visita todos los nodos siguiendo una regla fija.",
      rule: rules[type],
      current: `Visitando nodo ${node.value}`,
      partial: partial.join(", "),
      sequence: "En progreso.",
      pseudo: traversalPseudo(type),
    });
  }
  const note = type === "inorder" ? " En un árbol binario de búsqueda, inorden produce valores de menor a mayor." : "";
  updateEducation({
    operation: `Recorrido en ${names[type].toLowerCase()}`,
    definition: "El recorrido terminó después de visitar cada nodo exactamente una vez.",
    rule: rules[type],
    current: "Recorrido completo.",
    partial: sequence.map((node) => node.value).join(", "),
    sequence: `${sequence.map((node) => node.value).join(", ")}.${note}`,
    pseudo: traversalPseudo(type),
  });
  disableControls(false);
}

function traversalPseudo(type) {
  if (type === "preorder") {
    return `preorden(nodo):
  visitar nodo
  preorden(nodo.izquierdo)
  preorden(nodo.derecho)`;
  }
  if (type === "inorder") {
    return `inorden(nodo):
  inorden(nodo.izquierdo)
  visitar nodo
  inorden(nodo.derecho)`;
  }
  return `posorden(nodo):
  posorden(nodo.izquierdo)
  posorden(nodo.derecho)
  visitar nodo`;
}

function animateStep(value, edu) {
  clearHighlights();
  highlight(value, "#276ef1");
  updateEducation(edu);
  playStepSound(value);
  return new Promise((resolve) => {
    const timer = window.setTimeout(resolve, STEP_DELAY);
    state.timers.push(timer);
  });
}

function highlight(value, color) {
  const entity = state.nodes.get(value);
  const sphere = entity?.querySelector("a-sphere");
  if (sphere) sphere.setAttribute("color", color);
}

function clearHighlights() {
  state.labels.forEach((label) => label.remove());
  state.labels = [];
  state.nodes.forEach((entity, value) => {
    const sphere = entity.querySelector("a-sphere");
    if (sphere) sphere.setAttribute("color", value === state.selectedValue ? "#276ef1" : "#0d7c66");
  });
}

function addFloatingLabel(value, text) {
  const position = state.positions.get(value);
  if (!position || !state.treeGroup) return;
  const label = document.createElement("a-text");
  label.setAttribute("value", text);
  label.setAttribute("align", "center");
  label.setAttribute("anchor", "center");
  label.setAttribute("color", "#111b16");
  label.setAttribute("width", "3.2");
  label.setAttribute("position", `${position.x} ${position.y + 0.42} ${position.z + 0.08}`);
  state.treeGroup.append(label);
  state.labels.push(label);
}

function updateEducation({ operation, definition, rule, current, partial, sequence, pseudo }) {
  els.eduOperation.textContent = operation;
  els.eduDefinition.textContent = definition;
  els.eduRule.textContent = rule;
  els.eduCurrent.textContent = current;
  els.eduPartial.textContent = partial;
  els.eduSequence.textContent = sequence;
  els.eduPseudo.textContent = pseudo;
}

function announceError(message) {
  els.statusMessage.textContent = message;
  updateEducation({
    operation: "Aviso",
    definition: "La operación no puede ejecutarse con los datos actuales.",
    rule: message,
    current: "Sin cambios en el árbol.",
    partial: message,
    sequence: inorderValues().join(", "),
    pseudo: `validar(entrada):
  si no cumple las reglas
    detener operación`,
  });
}

function resetAll() {
  clearTimers();
  resetTree();
  renderTree();
  clearHighlights();
  updateEducation({
    operation: "Restablecer árbol",
    definition: "La estructura vuelve al conjunto inicial de siete valores.",
    rule: "Se eliminan inserciones, selecciones, mensajes y resultados anteriores.",
    current: "Nodo raíz: 50",
    partial: "Árbol inicial restaurado.",
    sequence: INITIAL_VALUES.join(", "),
    pseudo: `restablecer():
  detener animaciones
  borrar nodos insertados
  cargar árbol inicial`,
  });
}

async function startAr() {
  unlockAudio();
  if (!navigator.mediaDevices?.getUserMedia) {
    announceError("Este navegador no expone la cámara; se mantiene el modo Explorar en 3D.");
    createScene("explore");
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } },
      audio: false,
    });
    stream.getTracks().forEach((track) => track.stop());
    updateEducation({
      operation: "Realidad aumentada",
      definition: "AR.js detecta el marcador Hiro y ubica la escena tridimensional sobre él.",
      rule: "Mantén el marcador completo dentro de la cámara y evita reflejos.",
      current: "Esperando reconocimiento del marcador.",
      partial: "Permiso de cámara concedido.",
      sequence: "Cuando aparezca el marcador, el árbol se centrará sobre él.",
      pseudo: `iniciarAR():
  solicitar cámara trasera
  detectar marcador Hiro
  renderizar árbol sobre marcador`,
    });
    createScene("ar", true);
    setControlsOpen(false);
    setEducationOpen(false);
  } catch (error) {
    announceError("No se pudo usar la cámara; se activó el modo alternativo Explorar en 3D.");
    createScene("explore");
  }
}

function drawQr() {
  const url = window.location.href;
  els.qrFallback.href = url;
  els.qrFallback.textContent = url;
  if (!window.QRCode || !els.qrCode) {
    els.qrCode.textContent = "QR no disponible. Usa el enlace inferior.";
    return;
  }
  els.qrCode.replaceChildren();
  new window.QRCode(els.qrCode, {
    text: url,
    width: 120,
    height: 120,
    colorDark: "#17201b",
    colorLight: "#ffffff",
    correctLevel: window.QRCode.CorrectLevel.M,
  });
}

function disableControls(disabled) {
  state.isAnimating = disabled;
  document.querySelectorAll("button, input").forEach((control) => {
    if (control.id === "exitArButton") return;
    if (control.id === "controlsToggle") return;
    if (control.id === "educationToggle") return;
    if (control.id === "soundToggle") return;
    control.disabled = disabled;
  });
}

function setControlsOpen(isOpen) {
  els.controlsToggle.setAttribute("aria-expanded", String(isOpen));
  els.controlsBody.classList.toggle("hidden", !isOpen);
}

function setEducationOpen(isOpen) {
  els.educationToggle.setAttribute("aria-expanded", String(isOpen));
  els.educationPanel.classList.toggle("open", isOpen);
}

function readIntegerInput(input, actionName) {
  const rawValue = input.value.trim();
  if (!rawValue) {
    announceError(`Escribe un valor numérico para ${actionName}.`);
    input.focus();
    return null;
  }
  const value = Number(rawValue);
  if (!Number.isInteger(value)) {
    announceError("Usa únicamente números enteros.");
    input.focus();
    return null;
  }
  return value;
}

function unlockAudio() {
  if (!state.soundEnabled) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  if (!state.audioContext) state.audioContext = new AudioContext();
  if (state.audioContext.state === "suspended") state.audioContext.resume();
}

function playStepSound(value) {
  if (!state.soundEnabled) return;
  unlockAudio();
  const context = state.audioContext;
  if (!context) return;
  const now = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(440 + (Math.abs(value) % 7) * 35, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.12, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.13);
}

function clearTimers() {
  state.timers.forEach((timer) => window.clearTimeout(timer));
  state.timers = [];
}

function traverse(node, visit) {
  if (!node) return;
  visit(node);
  traverse(node.left, visit);
  traverse(node.right, visit);
}

function preorder(node, list) {
  if (!node) return;
  list.push(node);
  preorder(node.left, list);
  preorder(node.right, list);
}

function inorder(node, list) {
  if (!node) return;
  inorder(node.left, list);
  list.push(node);
  inorder(node.right, list);
}

function postorder(node, list) {
  if (!node) return;
  postorder(node.left, list);
  postorder(node.right, list);
  list.push(node);
}

function inorderValues() {
  const list = [];
  inorder(state.root, list);
  return list.map((node) => node.value);
}

function findNode(node, value) {
  if (!node) return null;
  if (node.value === value) return node;
  return value < node.value ? findNode(node.left, value) : findNode(node.right, value);
}

function countNodes(node) {
  if (!node) return 0;
  return 1 + countNodes(node.left) + countNodes(node.right);
}

function normalizeDepths(node, depth = 0) {
  if (!node) return;
  node.depth = depth;
  normalizeDepths(node.left, depth + 1);
  normalizeDepths(node.right, depth + 1);
}

function childSummary(node) {
  if (!node) return "No hay nodo seleccionado.";
  const left = node.left ? node.left.value : "sin hijo izquierdo";
  const right = node.right ? node.right.value : "sin hijo derecho";
  return `Izquierdo: ${left}. Derecho: ${right}.`;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

boot();
