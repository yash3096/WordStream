import React from 'react';
import ControlPanel from './control-panel/ControlPanel.jsx';
import Graph from './graph/Graph.jsx';
import StackBar from './stack-bar/StackBar.jsx';
import './WordStream.css';
import './loader/Loader.css';

export default class WordStream extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            layersData: null,
            wordsData: null,
            activeGraph: null,
            stackBarData: null,
            showSideGraph: false,
            isLoading: false
        };
        this.setLayersData = this.setLayersData.bind(this);
        this.setWordsData = this.setWordsData.bind(this);
        this.setActiveGraph = this.setActiveGraph.bind(this);
        this.setStackBarData = this.setStackBarData.bind(this);
        this.setShowSideGraph = this.setShowSideGraph.bind(this);
        this.setLoading = this.setLoading.bind(this);
        this.screenDimensions = [1200, 800];
    }

    setShowSideGraph(bool) {
        this.setState({
            showSideGraph: bool
        })
    }

    async setLoading(bool){
        return new Promise(resolve=>{
            return this.setState({
                isLoading: bool
            }, resolve())
        });
    }

    setStackBarData(stackBarData) {
        this.setState({
            stackBarData: stackBarData
        })
    }

    setLayersData(layersData) {
        this.setState({
            layersData: layersData
        });
    }

    setWordsData(wordsData) {
        this.setState({
            wordsData: wordsData
        })
    }

    setActiveGraph(activeGraph) {
        this.setState({
            activeGraph: activeGraph
        })
    }

    render() {
        return(
            <div className={this.state.isLoading? 'loadingDiv': 'mainDiv'}>
                <div className={this.state.isLoading? 'loading': 'hideLoading'}> </div>
                <h3 className="text-center"> WordStream: Interactive Topic Visualization </h3>
                <div className="row">
                    <div className="col-12 controlPanelDiv"> 
                        <ControlPanel
                            setLayersData={this.setLayersData}
                            setWordsData={this.setWordsData}
                            screenDimensions={this.screenDimensions}
                            setActiveGraph={this.setActiveGraph}
                            setLoading={this.setLoading}
                        />
                    </div>
                    <div className={this.state.showSideGraph ? 
                        'col-8 graphDiv' : 'col-12 graphDiv'}> 
                        <Graph 
                            layersData={this.state.layersData}
                            wordsData={this.state.wordsData}
                            screenDimensions={this.screenDimensions}
                            activeGraph={this.state.activeGraph}
                            setStackBarData={this.setStackBarData}
                            setShowSideGraph={this.setShowSideGraph}
                            setLoading={this.setLoading}/>
                    </div>
                    <div className={this.state.showSideGraph? 'col-4 stackBar' : 'hideStackBar'}> 
                        <StackBar 
                            activeGraph={this.state.activeGraph}
                            stackBarData={this.state.stackBarData}/>
                    </div>
                </div> 
            </div>
        )
    }
}