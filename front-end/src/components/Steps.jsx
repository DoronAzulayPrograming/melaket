import React from "react";
import { Button } from "react-bootstrap";

export const Steps = React.forwardRef((props,ref)=>{

    const [steps, setSteps] = React.useState([])
    const [activeIndex, setActiveIndex] = React.useState(0)

    // Use the forwarded ref to expose the handleNext function
    React.useImperativeHandle(ref, () => ({
        Prev: () => {handlePrev()},
        Next: () => {handleNext()}
    }));

    React.useEffect(()=>{
        if(!props.activeIndex) return
        if(props.activeIndex < 0) return
        if(props > steps.length - 1) return

        setActiveIndex(props.activeIndex) 
    },[props.activeIndex])

    React.useEffect(()=>{
       setSteps(React.Children.map(props.children, (child) =>
            child.type === Step ? React.cloneElement(child, { roles:props.roles }) : null
       )) 
    },[props.children])

    function handlePrev(){
        if(activeIndex - 1 < 0) return
        setActiveIndex(activeIndex - 1)
    }
    function handleNext(){
        if(activeIndex + 1 > steps.length - 1) return
        setActiveIndex(activeIndex + 1)
    }

    return(
        <div>
            {steps[activeIndex]}
            {!props.hideBtns && 
            <div className="d-flex justify-content-between mt-2">
                {activeIndex > 0 && <Button onClick={handlePrev}>הקודם</Button>}
                {(activeIndex < steps.length - 1) && <Button onClick={handleNext}>הבא</Button>}
            </div>}
            {props.hideBtns && activeIndex > 0 &&
            <div className="d-flex justify-content-between mt-2">
                {activeIndex > 0 && <Button onClick={handlePrev}>הקודם</Button>}
            </div>}
        </div>
    )

})

export function Step(props){

    return(
        <>
            {props.children}
        </>
    )

}

export default Steps