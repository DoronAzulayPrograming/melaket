import React, { useState, useRef, useEffect } from "react";
import { Form, ListGroup, InputGroup, Button } from "react-bootstrap";
import { toast } from "react-toastify"

export default function AutocompleteInput(props){
    const [inputValue, setInputValue] = useState('');
    const [filteredSuggestions, setFilteredSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
    const inputRef = useRef(null);
    const [isToggled, setIsToggled] = useState(false);

    useEffect(()=>{
        if(!props.value) return
        const handleDo = async () => {
            const userInput = props.value;
            const filtered = props.suggestions?.filter(
                (suggestion) => suggestion.name.toLowerCase().indexOf(userInput.toLowerCase()) > -1
            ) ?? [];
    
            const suggestionsFromApi = props.suggestions ? filtered : await fetchSuggestionsFromApi(userInput);
            const suggestion = suggestionsFromApi[0];
            setInputValue(suggestion.name)
            props.onSelect(suggestion)
        }
        handleDo()
    }, [props.value])

    const handleChange = async (e) => {
        const userInput = e.currentTarget.value;
        setInputValue(userInput);
        props.onSelect(null)

        const filtered = props.suggestions?.filter(
            (suggestion) => suggestion.name.toLowerCase().indexOf(userInput.toLowerCase()) > -1
        ) ?? [];

        if (userInput.length > 0) {
            const suggestionsFromApi = props.suggestions ? filtered : await fetchSuggestionsFromApi(userInput);
            setFilteredSuggestions(suggestionsFromApi);
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
        }

        setActiveSuggestionIndex(0); 
    };

    const fetchSuggestionsFromApi = async (query = "") => {
        try {
            let url = query ? `${props.url}?q=${query}` : `${props.url}`;
            const response = await fetch(url);
            if(!response.ok){
                toast.error(`שגיאה במשיכת נתונים קוד:${response.status}`);
                return [];
            }
            const data = await response.json();
            return data; // Adjust based on the shape of your API response
        } catch (error) {
            toast.error(`שגיאה במשיכת נתונים: ${error}`);
            return [];
        }
    };

    const handleKeyDown = (e) => {
        if (e.keyCode === 13) {
            e.preventDefault();  // Prevents form submission
            const suggestion = filteredSuggestions[activeSuggestionIndex]
            setInputValue(suggestion.name);
            setShowSuggestions(false);
            setIsToggled(false);
            props.onSelect(suggestion)
        } else if (e.keyCode === 38) {
            if (activeSuggestionIndex === 0) return;
            setActiveSuggestionIndex(activeSuggestionIndex - 1);
        } else if (e.keyCode === 40) {
            if (activeSuggestionIndex === filteredSuggestions.length - 1) return;
            setActiveSuggestionIndex(activeSuggestionIndex + 1);
        }
    };

    const handleSuggestionClick = (suggestion) => {
        props.onSelect(suggestion)
        setInputValue(suggestion.name);
        setFilteredSuggestions([]);
        setShowSuggestions(false);
        inputRef.current.blur(); 
    };

    const handleBlur = () => {
        setTimeout(() => {
            setShowSuggestions(false);
        }, 100);
    };

    const handleMouseOver = (idx) => {
        setActiveSuggestionIndex(idx);
    };

    async function handleToggleAll(){
        setIsToggled(prev => !prev); 
        setFilteredSuggestions(showSuggestions ? [] : props.suggestions ?? await fetchSuggestionsFromApi())
        setShowSuggestions(!showSuggestions)
    }

    return (
        <div style={{ position: "relative" }}>
            <div style={{ display: 'flex', alignItems: 'center', position: "relative" }}>
                <Form.Control
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onBlur={handleBlur}
                    placeholder="חפש..."
                />
                <Button variant="" onKeyDown={handleKeyDown} onClick={handleToggleAll} style={{ position: 'absolute', left: 0 }}>
                    {isToggled ? "▲" : "▼"}
                </Button>
            </div>
            {(showSuggestions && inputValue) || isToggled ? (
                <ListGroup style={{ position: "absolute", width:"100%", zIndex:1 }}>
                    {filteredSuggestions.map((suggestion, idx) => (
                        <ListGroup.Item
                            key={idx}
                            onMouseDown={() => handleSuggestionClick(suggestion)}
                            onMouseOver={() => handleMouseOver(idx)}
                            active={idx === activeSuggestionIndex}
                        >
                            {suggestion.name}
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            ) : null}
        </div>
    );
};