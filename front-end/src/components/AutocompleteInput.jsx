import React, { useState, useRef, useEffect } from "react";
import { Form, ListGroup, InputGroup, Button } from "react-bootstrap";
import { toast } from "react-toastify"

const AutocompleteInput = React.forwardRef((props, ref) =>{
    const [onWork, setOnWork] = useState(false);

    const wrapperRef = useRef(null);
    const [charsMinLen, setCharsMinLen] = useState(1);
    const [openUpwards, setOpenUpwards] = useState(false);

    const [inputValue, setInputValue] = useState('');
    const [filteredSuggestions, setFilteredSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
    const inputRef = useRef(null);
    const [isToggled, setIsToggled] = useState(false);

    React.useEffect(()=>{
        checkDropdownDirection()
    },[])

    useEffect(()=>{
        if(props.minLen){
            setCharsMinLen(props.minLen)
        }
        if(!props.value) return
        const handleDo = async () => {
            const userInput = props.value;
            const filtered = props.suggestions?.filter(
                (suggestion) => Number.isInteger(userInput) ?  suggestion.id === userInput : suggestion.name.toLowerCase().indexOf(userInput.toLowerCase()) > -1
            ) ?? [];
    
            const suggestionsFromApi = props.suggestions ? filtered : await fetchSuggestionsFromApi(userInput);
            const suggestion = suggestionsFromApi[0];

            if(suggestion){
                setInputValue(suggestion.name)
                if(props.onSelect)
                    props.onSelect(suggestion)
            }
        }
        handleDo()
    }, [props.value])

    const handleChange = async (e) => {

        const userInput = e.currentTarget.value;
        setInputValue(userInput);

        if(onWork) return
        setOnWork(true)

        props.onSelect(null)

        const filtered = props.suggestions?.filter(
            (suggestion) => suggestion.name.toLowerCase().indexOf(userInput.toLowerCase()) > -1
        ) ?? [];

        if (userInput.length > charsMinLen) {
            const suggestionsFromApi = props.suggestions ? filtered : await fetchSuggestionsFromApi(userInput);
            setFilteredSuggestions(suggestionsFromApi);
            if(showSuggestions)
                checkDropdownDirection()
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
        }

        setActiveSuggestionIndex(0); 
        setOnWork(false)
    };

    const fetchSuggestionsFromApi = async (query = "") => {
        try {
            let url = query ? props.url.includes("?") ? `${props.url}&q=${query}` : `${props.url}?q=${query}`: `${props.url}`;
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
        setIsToggled(false);
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
        if(showSuggestions)
            checkDropdownDirection()
        setShowSuggestions(!showSuggestions)
    }

    const checkDropdownDirection = () => {
        if (!wrapperRef.current) return;
    
        const rect = wrapperRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
    
        if (spaceBelow < 300) {  // assuming 300px is your dropdown's height
            setOpenUpwards(true);
        } else {
            setOpenUpwards(false);
        }
    };
    
    return (
        <div ref={wrapperRef} style={{ position: "relative" }}>
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
                <Button tabIndex="-1" variant="" onKeyDown={handleKeyDown} onClick={handleToggleAll} style={{ position: 'absolute', left: 0 }}>
                    {isToggled ? "▲" : "▼"}
                </Button>
            </div>
            {(showSuggestions && inputValue) || isToggled ? (
                <ListGroup style={{
                    position: "absolute",
                    width: "100%",
                    zIndex: 1,
                    maxHeight: '300px',
                    overflowY: 'auto',
                    bottom: openUpwards ? "100%" : undefined, // This will make it open upwards
                    top: openUpwards ? undefined : "100%"     // This will make it open downwards
                }}>
                {filteredSuggestions.length > 0 &&
                    filteredSuggestions.map((suggestion, idx) => {
                            if(!suggestion.divider){
                                return (
                                <ListGroup.Item
                                    key={idx}
                                    onMouseDown={() => handleSuggestionClick(suggestion)}
                                    onMouseOver={() => handleMouseOver(idx)}
                                    active={idx === activeSuggestionIndex}
                                >
                                    {suggestion.name}
                                </ListGroup.Item>
                                )
                            }
                            else{
                                return (
                                    <ListGroup.Item key={idx}>
                                        {suggestion.name && <b>{suggestion.name}</b>}
                                        {suggestion.divider}
                                    </ListGroup.Item>
                                )
                            }
                        }
                    )}
                    {!filteredSuggestions.length && <ListGroup.Item>אין תוצאות</ListGroup.Item> }
                </ListGroup>

            ) : null}
        </div>
    );
});

export default AutocompleteInput
