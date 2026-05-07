import toast from 'react-hot-toast';

const BASE_STYLE = {
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--text-sm)',
  borderRadius: 'var(--radius-md)',
  background: 'var(--color-white)',
  color: 'var(--color-black)',
  boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
  padding: '12px 16px',
  maxWidth: '360px',
};

export const showToast = {
  success: (message, options) =>
    toast.success(message, {
      style: {
        ...BASE_STYLE,
        borderLeft: '4px solid var(--color-success)',
      },
      iconTheme: {
        primary: 'var(--color-success)',
        secondary: 'var(--color-white)',
      },
      duration: 3500,
      ...options,
    }),

  error: (message, options) =>
    toast.error(message, {
      style: {
        ...BASE_STYLE,
        borderLeft: '4px solid var(--color-error)',
      },
      iconTheme: {
        primary: 'var(--color-error)',
        secondary: 'var(--color-white)',
      },
      duration: 4500,
      ...options,
    }),

  info: (message, options) =>
    toast(message, {
      style: {
        ...BASE_STYLE,
        borderLeft: '4px solid var(--color-brown)',
      },
      icon: 'ℹ️',
      duration: 3500,
      ...options,
    }),
};

export const TOASTER_PROPS = {
  position: 'top-right',
  toastOptions: {
    style: BASE_STYLE,
  },
};

export default showToast;
