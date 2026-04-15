<script lang="ts">
  interface Toast {
    id: string;
    message: string;
    detail: string;
    type: 'fill-buy' | 'fill-sell' | 'sl' | 'tp';
  }

  let toasts: Toast[] = $state([]);

  export function addToast(toast: Omit<Toast, 'id'>): void {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const entry: Toast = { ...toast, id };
    toasts = [...toasts, entry];

    setTimeout(() => {
      toasts = toasts.filter(t => t.id !== id);
    }, 3000);
  }
</script>

{#if toasts.length > 0}
  <div class="toast-container">
    {#each toasts as toast (toast.id)}
      <div
        class="toast-item"
        class:fill-buy={toast.type === 'fill-buy'}
        class:fill-sell={toast.type === 'fill-sell'}
        class:stop-loss={toast.type === 'sl'}
        class:take-profit={toast.type === 'tp'}
      >
        <div class="toast-message">{toast.message}</div>
        <div class="toast-detail">{toast.detail}</div>
      </div>
    {/each}
  </div>
{/if}

<style>
  .toast-container {
    position: absolute;
    bottom: 40px;
    right: 12px;
    z-index: 60;
    display: flex;
    flex-direction: column-reverse;
    gap: 6px;
    pointer-events: none;
    max-width: 280px;
  }

  .toast-item {
    padding: 10px 14px;
    border-radius: 6px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35), 0 1px 4px rgba(0, 0, 0, 0.2);
    animation: toastIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    pointer-events: auto;
    border-left: 3px solid transparent;
  }

  .toast-item.fill-buy {
    background: rgba(16, 185, 129, 0.14);
    border-left-color: var(--green);
  }

  .toast-item.fill-sell {
    background: rgba(239, 68, 68, 0.14);
    border-left-color: var(--red);
  }

  .toast-item.stop-loss {
    background: rgba(239, 68, 68, 0.14);
    border-left-color: var(--red);
  }

  .toast-item.take-profit {
    background: rgba(16, 185, 129, 0.14);
    border-left-color: var(--green);
  }

  :global(body.light) .toast-item {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12), 0 1px 4px rgba(0, 0, 0, 0.08);
  }

  :global(body.light) .toast-item.fill-buy {
    background: rgba(16, 185, 129, 0.1);
  }

  :global(body.light) .toast-item.fill-sell {
    background: rgba(239, 68, 68, 0.1);
  }

  :global(body.light) .toast-item.stop-loss {
    background: rgba(239, 68, 68, 0.1);
  }

  :global(body.light) .toast-item.take-profit {
    background: rgba(16, 185, 129, 0.1);
  }

  .toast-message {
    font-size: 11px;
    font-weight: 600;
    color: var(--text);
    margin-bottom: 2px;
  }

  .toast-detail {
    font-size: 10px;
    color: var(--text-muted);
    font-family: 'SF Mono', 'Consolas', 'Monaco', monospace;
  }

  @keyframes toastIn {
    from {
      opacity: 0;
      transform: translateY(8px) scale(0.96);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
</style>
