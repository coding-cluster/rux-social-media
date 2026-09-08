// Small hand-rolled i18n: two flat dictionaries and a reactive locale flag.
// ponytail: no vue-i18n — the app has ~25 static strings, a lookup object
// covers it, and pulling in a library for that would be the over-engineered
// choice, not the lazy one.
import { reactive } from 'vue'

const STORAGE_KEY = 'rux-locale'

const dict = {
  en: {
    post: 'Post',
    profile: 'Profile',
    signIn: 'Sign in',
    loading: 'Loading…',
    feedEmpty: 'Nothing on the wall yet. Follow someone, or hang the first thing.',
    showMore: 'Show more',
    posts: 'posts',
    nothingHungYet: 'Nothing hung yet.',
    noProfile: "No one's hung anything under that name.",
    like: 'Like',
    liked: 'Liked',
    welcomeBack: 'Welcome back',
    createAccount: 'Create an account',
    signInSubtitle: 'Sign in to see what’s new on the wall.',
    signUpSubtitle: 'Sign up and get your first photo on the wall.',
    displayName: 'Display name',
    handle: 'Handle',
    email: 'Email',
    password: 'Password',
    pleaseWait: 'Please wait…',
    haveAccount: 'Have an account? Sign in',
    newHere: 'New here? Sign up',
    hangSomething: 'Hang something',
    hangSubtitle: 'Add a photo to your wall.',
    choosePhoto: 'Click to choose a photo',
    caption: 'Caption',
    captionPlaceholder: 'Say something about it…',
    hanging: 'Hanging…',
    hangIt: 'Hang it',
  },
  es: {
    post: 'Publicar',
    profile: 'Perfil',
    signIn: 'Iniciar sesión',
    loading: 'Cargando…',
    feedEmpty: 'Todavía no hay nada en la pared. Sigue a alguien, o cuelga lo primero.',
    showMore: 'Mostrar más',
    posts: 'publicaciones',
    nothingHungYet: 'Todavía no se ha colgado nada.',
    noProfile: 'Nadie ha colgado nada con ese nombre.',
    like: 'Me gusta',
    liked: 'Te gusta',
    welcomeBack: 'Bienvenido de nuevo',
    createAccount: 'Crear una cuenta',
    signInSubtitle: 'Inicia sesión para ver qué hay de nuevo en la pared.',
    signUpSubtitle: 'Regístrate y cuelga tu primera foto en la pared.',
    displayName: 'Nombre para mostrar',
    handle: 'Usuario',
    email: 'Correo electrónico',
    password: 'Contraseña',
    pleaseWait: 'Un momento…',
    haveAccount: '¿Ya tienes cuenta? Inicia sesión',
    newHere: '¿Nuevo por aquí? Regístrate',
    hangSomething: 'Cuelga algo',
    hangSubtitle: 'Añade una foto a tu pared.',
    choosePhoto: 'Haz clic para elegir una foto',
    caption: 'Descripción',
    captionPlaceholder: 'Cuenta algo sobre ella…',
    hanging: 'Colgando…',
    hangIt: 'Colgarla',
  },
}

function readStored() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'es' ? 'es' : 'en'
  } catch {
    return 'en'
  }
}

export const i18n = reactive({ locale: readStored() })

export function t(key) {
  return dict[i18n.locale][key] ?? dict.en[key] ?? key
}

export function toggleLocale() {
  i18n.locale = i18n.locale === 'en' ? 'es' : 'en'
  try {
    localStorage.setItem(STORAGE_KEY, i18n.locale)
  } catch {
    // storage unavailable — locale just won't survive a reload
  }
}
