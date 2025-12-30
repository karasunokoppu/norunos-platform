import type React from "react";
import { useEffect, useRef, useState } from "react";

interface DropdownOption {
	value: string;
	label: string;
}

interface NorunoDropdownProps {
	value: string;
	onChange: (value: string) => void;
	options: DropdownOption[];
	placeholder?: string;
}

const NorunoDropdown: React.FC<NorunoDropdownProps> = ({
	value,
	onChange,
	options,
	placeholder = "Select...",
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const [focusedIndex, setFocusedIndex] = useState(-1);
	const dropdownRef = useRef<HTMLDivElement>(null);

	const selectedOption = options.find((opt) => opt.value === value);
	const displayText = selectedOption ? selectedOption.label : placeholder;

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
				setFocusedIndex(-1);
			}
		};

		if (isOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isOpen]);

	// Keyboard navigation
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (!isOpen) {
			if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
				e.preventDefault();
				setIsOpen(true);
				setFocusedIndex(0);
			}
			return;
		}

		switch (e.key) {
			case "ArrowDown":
				e.preventDefault();
				setFocusedIndex((prev) =>
					prev < options.length - 1 ? prev + 1 : prev,
				);
				break;
			case "ArrowUp":
				e.preventDefault();
				setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev));
				break;
			case "Enter":
				e.preventDefault();
				if (focusedIndex >= 0 && focusedIndex < options.length) {
					onChange(options[focusedIndex].value);
					setIsOpen(false);
					setFocusedIndex(-1);
				}
				break;
			case "Escape":
				e.preventDefault();
				setIsOpen(false);
				setFocusedIndex(-1);
				break;
		}
	};

	const handleOptionClick = (optionValue: string) => {
		onChange(optionValue);
		setIsOpen(false);
		setFocusedIndex(-1);
	};

	return (
		<div
			role="listbox"
			className="relative w-32"
			ref={dropdownRef}
			onKeyDown={handleKeyDown}
		>
			<button
				type="button"
				className="w-full flex items-center justify-between px-3 py-2 bg-bg-active border border-border-primary rounded-md text-text-secondary hover:bg-bg-hover focus:outline-none focus:ring-2 focus:ring-accent-secondary focus:border-accent-secondary transition-colors duration-200"
				onClick={() => setIsOpen(!isOpen)}
			>
				<span className="truncate">{displayText}</span>
				<svg
					className={`w-4 h-4 ml-2 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M19 9l-7 7-7-7"
					/>
				</svg>
			</button>

			{isOpen && (
				<div className="absolute z-50 w-full mt-1 bg-bg-active border border-border-primary rounded-md shadow-lg max-h-60 overflow-auto animate-in fade-in slide-in-from-top-2 duration-200">
					{options.map((option, index) => (
						<button
							type="button"
							key={option.value}
							className={`w-full text-left px-3 py-2 text-text-secondary hover:bg-bg-hover focus:bg-bg-hover focus:outline-none transition-colors duration-150 ${
								index === focusedIndex ? "bg-bg-hover" : ""
							} ${
								option.value === value
									? "bg-accent-light text-text-on-accent"
									: ""
							}`}
							onClick={() => handleOptionClick(option.value)}
							onMouseEnter={() => setFocusedIndex(index)}
						>
							{option.label}
						</button>
					))}
				</div>
			)}
		</div>
	);
};

export default NorunoDropdown;
