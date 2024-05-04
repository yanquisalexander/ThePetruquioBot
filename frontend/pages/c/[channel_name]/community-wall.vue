<template>
  <div>
    <div
      class="relative h-screen bg-gray-200"
      @wheel="handleZoom"
    >
      <canvas
        id="canvas"
        class="h-full w-full top-0 left-0 absolute bg-white"
        @click="onPixelClick"
      ></canvas>
      <div
        id="grid"
        :style="{ transform: `scale(${1 * zoomLevel})` }"
      ></div>
      <div
        id="cursor"
        class="fixed top-0 left-0 w-4 h-4 border-2 border-black z-10"
        :style="{ transform: `translate(${cursor.x * pixelSize * zoomLevel}px, ${cursor.y * pixelSize * zoomLevel}px) scale(${1 * zoomLevel})` }"
      ></div>
    </div>
    <div
      id="palette"
      class="fixed bottom-0 left-0 w-full h-16 bg-gray-800 flex justify-center"
    >
      <div class="flex items-center justify-center">
        <template v-for="(color, index) in COLORS" :key="index">
          <div
            class="w-8 h-8 rounded-full mx-2 cursor-pointer"
            :style="`background-color: ${color}`"
            @click="cursor.color = color"
          ></div>
        </template>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import axios from "axios";

definePageMeta({
  layout: 'channel-overview'
});

const CANVAS_WIDTH = ref(600);
const CANVAS_HEIGHT = ref(600);

const Pixels = ref([]);

const isDragging = ref(false);
const dragStart = ref({ x: 0, y: 0 });

const startDrag = (event: MouseEvent) => {
  isDragging.value = true;
  dragStart.value = {
    x: event.clientX,
    y: event.clientY
  };
};

const handleDrag = (event: MouseEvent) => {
  if (isDragging.value) {
    // Calcular el cambio en las coordenadas del ratón
    const deltaX = event.clientX - dragStart.value.x;
    const deltaY = event.clientY - dragStart.value.y;

    // Actualizar la posición del cursor y el punto de inicio de arrastre
    cursor.value.x += deltaX / (pixelSize * zoomLevel.value);
    cursor.value.y += deltaY / (pixelSize * zoomLevel.value);
    dragStart.value = { x: event.clientX, y: event.clientY };

    // Aplicar transformación directa al cursor
    cursor.value.x = Math.max(0, Math.min(cursor.value.x, CANVAS_WIDTH.value / (pixelSize * zoomLevel.value)));
    cursor.value.y = Math.max(0, Math.min(cursor.value.y, CANVAS_HEIGHT.value / (pixelSize * zoomLevel.value)));

    // Aplicar transformación directa al canvas
    CANVAS_ELEMENT.value.style.transform = `scale(${zoomLevel.value}) translate(${cursor.value.x * pixelSize}px, ${cursor.value.y * pixelSize}px)`;
  }
};

const endDrag = () => {
  isDragging.value = false;
};

const COLORS = [
  '#FF0000',
  '#FF7F00',
  '#FFFF00',
  '#00FF00',
  '#0000FF',
  '#4B0082',
  '#9400D3'
];

const cursor = ref({
  x: 0,
  y: 0,
  color: '#FF0000'
});

const CANVAS_ELEMENT: Ref<HTMLCanvasElement | null> = ref(null);
const zoomLevel = ref(1);
const pixelSize = 3;

const setupCanvas = () => {
  if (CANVAS_ELEMENT.value) {
    CANVAS_ELEMENT.value.width = CANVAS_WIDTH.value;
    CANVAS_ELEMENT.value.height = CANVAS_HEIGHT.value;
    CANVAS_ELEMENT.value.addEventListener('click', onPixelClick);
    CANVAS_ELEMENT.value.addEventListener('mousemove', handleMouseMovement)
    CANVAS_ELEMENT.value.addEventListener('mousedown', startDrag);
    CANVAS_ELEMENT.value.addEventListener('mouseup', endDrag);

    drawPixel(0, 0, 'black');
  }
};

const route = useRoute();
const channelName = ref(route.params.channel_name);
const communityWall = ref(null);

const fetchCommunityWall = async () => {
  const response = await axios(`${API_ENDPOINT}/community-walls/${channelName.value}`);
  console.log(response.data.data);

  communityWall.value = response.data.data;
  CANVAS_HEIGHT.value = communityWall.value.canvas_size.split('x')[0];
  CANVAS_WIDTH.value = communityWall.value.canvas_size.split('x')[1];

  CANVAS_ELEMENT.value = document.getElementById('canvas') as HTMLCanvasElement;

  setupCanvas();
};

const handleZoom = (event: WheelEvent) => {
  event.preventDefault();

  // Invertir la dirección de zoom
  const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;

  // Calcular el nuevo nivel de zoom
  const newZoomLevel = Math.min(Math.max(zoomLevel.value * zoomFactor, 1), 8);

  // Si el nuevo nivel de zoom es igual al nivel actual, no hacer nada
  if (newZoomLevel === zoomLevel.value) {
    return;
  }

  // Obtener el rectángulo actual del canvas
  const rect = CANVAS_ELEMENT.value.getBoundingClientRect();

  // Obtener las coordenadas del ratón en relación con el canvas
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  // Calcular el cambio en el nivel de zoom
  const scaleChange = newZoomLevel / zoomLevel.value;

  // Calcular la nueva posición del cursor después del zoom
  cursor.value.x = (mouseX / zoomLevel.value + rect.left) * scaleChange - rect.left / zoomLevel.value;
  cursor.value.y = (mouseY / zoomLevel.value + rect.top) * scaleChange - rect.top / zoomLevel.value;

  // Actualizar el nivel de zoom
  zoomLevel.value = newZoomLevel;

  // Aplicar el escalado directamente al canvas
  CANVAS_ELEMENT.value.style.transform = `scale(${zoomLevel.value}) translate(${cursor.value.x * pixelSize}px, ${cursor.value.y * pixelSize}px)`;
};



const handleMouseMovement = (event: MouseEvent) => {
  const rect = CANVAS_ELEMENT.value.getBoundingClientRect();

  // Obtener las coordenadas del ratón en relación con el canvas
  const mouseX = (event.clientX - rect.left) / (pixelSize * zoomLevel.value);
  const mouseY = (event.clientY - rect.top) / (pixelSize * zoomLevel.value);

  // Calcular la posición del píxel redondeando las coordenadas
  const x = Math.floor(mouseX);
  const y = Math.floor(mouseY);

  // Actualizar la posición del cursor
  cursor.value.x = x;
  cursor.value.y = y;
};

const drawPixel = (x: number, y: number, color: string) => {
  const ctx = CANVAS_ELEMENT.value?.getContext('2d');
  if (ctx) {
    ctx.fillStyle = color;
    ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
  }

  Pixels.value.push({
    x,
    y,
    color
  });
};

const onPixelClick = (event: MouseEvent) => {
  const rect = CANVAS_ELEMENT.value.getBoundingClientRect();

  // Obtener las coordenadas del ratón en relación con el canvas
  const mouseX = (event.clientX - rect.left) / (pixelSize * zoomLevel.value);
  const mouseY = (event.clientY - rect.top) / (pixelSize * zoomLevel.value);

  // Calcular la posición del píxel redondeando las coordenadas
  const x = Math.floor(mouseX);
  const y = Math.floor(mouseY);

  // Dibujar el píxel en la posición calculada
  drawPixel(x, y, cursor.value.color);
};

onMounted(() => {
  fetchCommunityWall();
});
</script>
