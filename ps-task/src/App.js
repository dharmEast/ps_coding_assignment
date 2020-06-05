import React, { useState, useEffect } from 'react';
import "core-js/stable";
import "regenerator-runtime/runtime";
import './App.css';
import axios from "axios";
import BootstrapTable from "react-bootstrap-table-next";
import * as ReactBootStrap from 'react-bootstrap';
import { LineChart, PieChart } from 'react-chartkick'
import 'chart.js'
const baseUrl = `https://hn.algolia.com/api/v1/search?tags=story`;
const size = 10;
function App() {
  const [comments, setComments] = useState([]);
  const [graphData, setGraphData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currPage, setCurrPage] = useState(1);
  const [prevClass, setPrevClass] = useState('btn');
  const [nextClass, setNextClass] = useState('btn active');
  const [totalNoOfPage, setTotalNoOfPage] = useState('');
  const createGraphData = (chartMetaData) => {
    let res = chartMetaData && chartMetaData.length > 0 && chartMetaData.map(report => {
      return {
        'x': parseInt(report.objectID),
        'y': parseInt(report.relevancy_score)
      }
    })
    let dataSetForGraph = {};
    for (var i = 0; i < res.length; i++) {
      dataSetForGraph[res[i].x] = res[i].y;
    }
    return dataSetForGraph;
  }

  const dataUpdation = (totalComments) => {
    if (totalComments && totalComments.length > 0) {
      setComments(totalComments);
      const pageLoadingGarphData = createGraphData(totalComments);
      debugger;
      setGraphData(pageLoadingGarphData);
    }
  }
  const getCommentsFromStorage = (totalComments) => {
    if (totalComments && totalComments.length > 0) {
      setComments(totalComments);
      const pageLoadingGarphData = createGraphData(totalComments);
      debugger
      setGraphData(pageLoadingGarphData);
      const storageCurrPage = parseInt(localStorage.currPage);
      setCurrPage(storageCurrPage)
      setLoading(true);
    }
  }

  const getCommentsByPagination = async (pageNum) => {
    setLoading(false);
    let url = `${baseUrl}&page=${pageNum}&&hitsPerPage=${size}`;
    const totalCommentsData = await axios.get(url);
    const totalComments = totalCommentsData.data.hits;
    localStorage[`totalComments_${pageNum}`] = JSON.stringify(totalComments);
    localStorage.currPage = pageNum;
    dataUpdation(totalComments);
    setLoading(true);
  }
  const getComments = async () => {
    try {
      const data = await axios.get(`https://hn.algolia.com/api/v1/search?tags=story&hitsPerPage=${size}`);
      const totalNumberOfData = data.data.nbPages * data.data.hitsPerPage;
      localStorage.totalNoOfPage = data.data.nbPages;
      setTotalNoOfPage(data.data.nbPages);
      await getCommentsByPagination(currPage);
    } catch (error) {
      console.log(error);
    }
  }
  useEffect(() => {
    const currPageStorage = localStorage.currPage;
    if (localStorage[`totalComments_${currPageStorage}`]) {
      const totalComments = JSON.parse(localStorage[`totalComments_${currPageStorage}`]);
      getCommentsFromStorage(totalComments);
      const storageCurrPage = parseInt(localStorage.currPage);
      if (currPageStorage > 1) {
        setPrevClass('btn active');
      }
      if (currPageStorage === parseInt(localStorage.totalNoOfPage)) {
        setNextClass('btn');
      }
      setCurrPage(storageCurrPage)
    } else {
      getComments()
    }
  }, []);
  const upVoteHandler = (rowIndex, e) => {
    e.preventDefault();
    comments[rowIndex].relevancy_score = comments[rowIndex].relevancy_score ? comments[rowIndex].relevancy_score + 1 : 1;
    localStorage[`totalComments_${currPage}`] = JSON.stringify(comments);
    localStorage.currPage = currPage;
    dataUpdation(comments);
  }
  function rankFormatter(cell, row, rowIndex, formatExtraData) {
    return (
      < div
        style={{
          textAlign: "center",
          cursor: "pointer",
          lineHeight: "normal"
        }}>

        < div
          className={'upVote'}
          onClick={(e) => upVoteHandler(rowIndex, e)}
        />
      </div>
    );
  }
  const hideHandler = (rowIndex, e) => {
    e.preventDefault();

    comments.splice(rowIndex, 1);
    localStorage[`totalComments_${currPage}`] = JSON.stringify(comments);
    getCommentsFromStorage(comments);
  }

  function miliSecondToTime(s) {
    var ms = s % 1000;
    s = (s - ms) / 1000;
    var secs = s % 60;
    s = (s - secs) / 60;
    var mins = s % 60;
    var hrs = (s - mins) / 60;

    return hrs + ':' + mins + ':' + secs + '.' + ms;
  }
  const timeDiff = (givenDate) => {
    var pastDate = new Date(givenDate);
    var pastDateMiliseconds = pastDate.getTime();
    var currentMiliseconds = Date.now();
    const diffInMiliseconds = currentMiliseconds - pastDateMiliseconds;
    return miliSecondToTime(diffInMiliseconds);
  }
  function priceFormatter(cell, row, rowIndex, formatExtraData) {
    let hostName = null;

    if (row && row.url) {
      const url = new URL(row.url);
      hostName = url.hostname;
    }
    const createdAt = timeDiff(row.created_at);
    return (
      <span>
        <strong>
          {`${cell} `}
        </strong>
        <span>
          {`(${hostName}) by `}
        </span>
        <strong style={{ fontSize: 'smaller' }}> {row.author || 'N/A'} </strong>
        <span>
          {`${createdAt} hr ago`}
        </span>
        <span style={{ color: '#6c757d' }}>
          [
          </span>
        <strong style={{ cursor: 'pointer', fontSize: 'smaller' }} onClick={(e) => hideHandler(rowIndex, e)}> hide </strong>
        <span style={{ color: '#6c757d' }}>
          ]
          </span>
      </span>
    )
  }

  const columns = [
    {
      dataField: "num_comments",
      text: "Comments",
      headerStyle: (colum, colIndex) => {
        return { width: '20%', textAlign: 'center', backgroundColor: '#ff7700' };
      }
    },
    {
      dataField: "edit",
      text: "UpVote",
      sort: false,
      formatter: rankFormatter,
      headerAttrs: { width: 100 },
      attrs: { width: 50, className: "EditRow" },
      headerStyle: (colum, colIndex) => {
        return { width: '20%', textAlign: 'center', backgroundColor: '#ff7700' };
      }
    },
    {
      dataField: "relevancy_score",
      text: "Vote Count",
      headerStyle: (colum, colIndex) => {
        return { width: '20%', textAlign: 'center', backgroundColor: '#ff7700' };
      }
    },
    {
      dataField: `title`,
      text: "News Details",
      formatter: priceFormatter,
      headerStyle: (colum, colIndex) => {
        return { textAlign: 'center', backgroundColor: '#ff7700' };
      }
    }
  ]

  const graphDataToRender = [{
    type: "line",
    dataPoints: graphData && graphData.length > 0 ? graphData : []
  }]
  const handleNextData = () => {
    if (currPage === totalNoOfPage) {
      return;
    }
    const nextPage = currPage + 1;
    if (nextPage > 1 && prevClass.indexOf('active') === -1) {
      let prevClassActive = prevClass + ' active';
      setPrevClass(prevClassActive);
    }
    if (nextPage === totalNoOfPage) {
      setNextClass('btn');
    }
    if (localStorage[`totalComments_${nextPage}`]) {
      const totalComments = JSON.parse(localStorage[`totalComments_${nextPage}`]);
      getCommentsFromStorage(totalComments);
    } else {
      getCommentsByPagination(nextPage);
    }
    setCurrPage(nextPage);
  };

  const handlePreviousData = () => {
    const currPrevClass = prevClass;
    if (currPage === 1 && prevClass === 'btn') {
      return;
    }
    const prevPage = currPage > 1 ? currPage - 1 : 1;

    if (prevPage === 1 && prevClass.indexOf('active') !== -1) {
      setPrevClass('btn');
    }
    if (prevPage > 1 && prevClass.indexOf('active') === -1) {
      setNextClass('btn active');
    }
    if (localStorage[`totalComments_${prevPage}`]) {
      const totalComments = JSON.parse(localStorage[`totalComments_${prevPage}`]);
      getCommentsFromStorage(totalComments);
    } else {
      getCommentsByPagination(prevPage);
    }
    setCurrPage(prevPage);
  };

  return (
    <div className="App">
      {loading ?
        <>
          <BootstrapTable
            keyField="name"
            data={comments}
            columns={columns}
          />
          <div className='prev_next_class'>
            <button className={prevClass} onClick={handlePreviousData}>Previous</button>
            <span style={{ color: '#ff7700', fontWeight: 'bold' }}>|</span>
            <button className={nextClass} onClick={handleNextData}>Next</button>
          </div>
          <div className={'divider'}></div>
          <LineChart data={graphData}
            responsive={true}
            xtitle="ID" ytitle="Votes"
            curve={false} />
        </> : (
          <ReactBootStrap.Spinner animation="border" text="Data is loading" />
        )}
    </div>
  );
}

export default App;
