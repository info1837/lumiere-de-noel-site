"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Sélecteur personnalisé — remplaçant moderne du <select> natif.
 *
 * Accessibilité (motif combobox/listbox WAI-ARIA) :
 *  - Enter / Espace / ArrowDown / ArrowUp ouvrent la liste
 *  - ArrowUp/Down naviguent, Home/End sautent en haut/bas
 *  - Enter / Espace sélectionnent ; Esc ferme ; Tab ferme et avance
 *  - Click extérieur ferme la liste
 *  - aria-activedescendant suit l'option active sans déplacer le focus DOM
 *
 * API : value / onChange(value) / options[] / placeholder / id / ariaLabel
 */
export default function Select({
  id,
  value = "",
  onChange,
  options = [],
  placeholder = "Sélectionnez…",
  ariaLabel,
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const triggerRef = useRef(null);
  const listRef = useRef(null);
  const wrapRef = useRef(null);
  const listId = `${id || "ld-select"}-listbox`;

  // Fermeture : clic extérieur
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // À l'ouverture : positionne l'index actif sur la valeur courante
  useEffect(() => {
    if (!open) return;
    const idx = options.indexOf(value);
    setActiveIndex(idx >= 0 ? idx : 0);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll auto de l'option active dans la vue
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    const el = listRef.current?.querySelector(`[data-idx="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const pick = (opt) => {
    onChange?.(opt);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onKeyDown = (e) => {
    if (!open) {
      if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(e.key)) {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min((i < 0 ? -1 : i) + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max((i < 0 ? options.length : i) - 1, 0));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActiveIndex(options.length - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (activeIndex >= 0) pick(options[activeIndex]);
      else setOpen(false);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "Tab") {
      setOpen(false); // laisse Tab faire son travail
    }
  };

  const hasValue = !!value;
  const activeId = activeIndex >= 0 ? `${listId}-opt-${activeIndex}` : undefined;

  return (
    <div className="ld-select" ref={wrapRef}>
      <button
        type="button"
        ref={triggerRef}
        id={id}
        className={`ld-select__trigger${open ? " is-open" : ""}${hasValue ? " has-value" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? activeId : undefined}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKeyDown}
      >
        <span className="ld-select__value">{value || placeholder}</span>
        <svg
          className="ld-select__chevron"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          aria-hidden="true"
        >
          <path
            d="M3 6l5 5 5-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          className="ld-select__menu"
          tabIndex={-1}
        >
          {options.map((opt, i) => {
            const selected = value === opt;
            const active = i === activeIndex;
            return (
              <li
                key={opt}
                id={`${listId}-opt-${i}`}
                data-idx={i}
                role="option"
                aria-selected={selected}
                className={`ld-select__option${active ? " is-active" : ""}${selected ? " is-selected" : ""}`}
                onMouseEnter={() => setActiveIndex(i)}
                // mousedown (pas click) : empêche le blur du trigger avant la sélection
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(opt);
                }}
              >
                <span className="ld-select__bullet" aria-hidden="true" />
                <span className="ld-select__label">{opt}</span>
                {selected && (
                  <svg
                    className="ld-select__check"
                    width="14"
                    height="14"
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                  >
                    <path
                      d="M3 8.5l3.2 3.2L13 5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
