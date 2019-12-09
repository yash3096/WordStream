import React from 'react';
import ForceDirectedGraph from '../ForceGraph/ForceGraph.jsx';
import Modal from 'react-modal';
import './ForceModal.css';

export default class ForceModal extends React.Component {
    constructor(props) {
        super(props);
    }
    
    render() {
        const {
            title, isOpen, setModalOpen, activeGraph, selectedYear, fields
          } = this.props;
        return (
            <Modal
                id="test"
                contentLabel="modalA"
                closeTimeoutMS={150}
                isOpen={isOpen}
                ariaHideApp={false}
                // style={customStyles}
                onRequestClose={()=>setModalOpen(false)}>
                <h1 className="modalHeader" textAlign="center">
                    {activeGraph==='youtube'?`Connections between Youtube channels for ${selectedYear}`:`Connections between Olympic athletes for ${selectedYear}`}
                    <span onClick={()=>setModalOpen(false)} className="closeBtn"> &#10006; </span>
                </h1>
                <ForceDirectedGraph activeGraph={activeGraph} selectedYear={selectedYear} fields={fields}/>
            </Modal>
        )
    }
}