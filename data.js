/* ════════════════════════════════════════════════
   BarberBook – WebinDev  |  data.js
   Datos estáticos y de demo de la aplicación
   ════════════════════════════════════════════════ */

// ─── CATÁLOGO ───
const BARBEROS = [
  { id: 1, nombre: "Mateo",     emoji: "🧔🏻", especialidad: "Fade & Diseño"   },
  { id: 2, nombre: "Andrés",    emoji: "✂️",   especialidad: "Clásico & Barba" },
  { id: 3, nombre: "Sebastián", emoji: "🎨",   especialidad: "Degradados"      },
  { id: 4, nombre: "Camilo",    emoji: "💈",   especialidad: "All Round"       },
];

const SERVICIOS = [
  { id: 1, nombre: "Corte clásico",       duracion: "30 min", precio: 20000 },
  { id: 2, nombre: "Fade / Degradado",    duracion: "45 min", precio: 25000 },
  { id: 3, nombre: "Corte + Barba",       duracion: "60 min", precio: 35000 },
  { id: 4, nombre: "Diseño de barba",     duracion: "30 min", precio: 18000 },
  { id: 5, nombre: "Cejas",               duracion: "15 min", precio:  8000 },
  { id: 6, nombre: "Hidratación capilar", duracion: "20 min", precio: 12000 },
];

// ─── HORARIOS Y OCUPADOS ───
const HORARIOS = [
  "8:00 AM","8:30 AM","9:00 AM","9:30 AM","10:00 AM","10:30 AM",
  "11:00 AM","11:30 AM","12:00 PM","2:00 PM","2:30 PM","3:00 PM",
  "3:30 PM","4:00 PM","4:30 PM","5:00 PM","5:30 PM"
];

const OCUPADOS = ["9:00 AM","10:30 AM","2:00 PM","4:00 PM"];

// ─── CONTACTO ───
const BARBER_WHATSAPP = "573001234567";

// ─── CREDENCIALES (demo) ───
const CREDS = { admin: "admin123", barbero: "barbero123" };

const PASSWORDS_BARBERO = {
  1: "mateo123",
  2: "andres123",
  3: "sebas123",
  4: "camilo123",
};

// ─── CITAS DE DEMO ───
let CITAS = [
  { id:1, barberoId:1, cliente:"Carlos Gómez",   tel:"3001112222", servicios:["Fade / Degradado"],               fecha:"2026-04-25", hora:"8:00 AM",  estado:"pendiente",  total:25000 },
  { id:2, barberoId:2, cliente:"Andrés Torres",  tel:"3002223333", servicios:["Corte clásico","Cejas"],          fecha:"2026-04-25", hora:"9:30 AM",  estado:"confirmada", total:28000 },
  { id:3, barberoId:1, cliente:"Felipe Ruiz",    tel:"3003334444", servicios:["Corte + Barba"],                  fecha:"2026-04-25", hora:"10:00 AM", estado:"atendida",   total:35000 },
  { id:4, barberoId:3, cliente:"Jorge Herrera",  tel:"3004445555", servicios:["Diseño de barba"],               fecha:"2026-04-25", hora:"11:00 AM", estado:"atendida",   total:18000 },
  { id:5, barberoId:4, cliente:"Simón Castro",   tel:"3005556666", servicios:["Corte clásico"],                 fecha:"2026-04-25", hora:"2:00 PM",  estado:"pendiente",  total:20000 },
  { id:6, barberoId:2, cliente:"David León",     tel:"3006667777", servicios:["Fade / Degradado","Diseño de barba"], fecha:"2026-04-24", hora:"3:00 PM", estado:"atendida", total:43000 },
  { id:7, barberoId:1, cliente:"Matías Peña",    tel:"3007778888", servicios:["Hidratación capilar"],           fecha:"2026-04-24", hora:"4:30 PM", estado:"noshow",     total:12000 },
  { id:8, barberoId:3, cliente:"Nicolás Vera",   tel:"3008889999", servicios:["Corte + Barba"],                 fecha:"2026-04-23", hora:"10:30 AM", estado:"atendida",  total:35000 },
];

// ─── BLOQUEOS DE DEMO ───
let BLOQUEOS = [
  { id:1, tipo:"dia",   barberoId:0, fecha:"2026-05-01", motivo:"Día del Trabajo" },
  { id:2, tipo:"rango", barberoId:2, fecha:"2026-04-26", desde:"2:00 PM", hasta:"5:30 PM", motivo:"Cita médica" },
];

// ─── DATOS ESTÁTICOS DE INGRESOS (demo barbero) ───
const INGRESOS_DATA = {
  dia:    { label: "Ingresos hoy",        value: "$78.000",  sub: "3 citas atendidas" },
  semana: { label: "Ingresos esta semana", value: "$203.000", sub: "8 citas atendidas" },
  mes:    { label: "Ingresos este mes",    value: "$744.000", sub: "29 citas atendidas" },
};
