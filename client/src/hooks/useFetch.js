import {useState, useEffect, useCallback, useRef} from 'react'
import axios from 'axios'

const useFetch = (url) =>{
    const [data, setData] = useState([])
    const [error, setError] = useState(false)
    const [loading, setLoading] = useState(true)
    const activeRequest = useRef(null)

    const reFetch = useCallback(async ()=>{
        activeRequest.current?.abort()
        const controller = new AbortController()
        activeRequest.current = controller
        setLoading(true)
        setError(false)
        try{
            const response = await axios.get(url, { signal: controller.signal })
            // A missing API proxy can return the SPA HTML with HTTP 200.
            // Keep that response out of components expecting arrays/objects.
            if (!response.headers['content-type']?.includes('application/json') ||
                response.data === null || typeof response.data !== 'object') {
                throw new Error('Expected JSON data from the API. Check the API server and proxy configuration.')
            }
            if (!controller.signal.aborted) setData(response.data)
        }catch(err){
            if (!controller.signal.aborted) {
                setData([])
                setError(err)
            }
        }finally{
            if (!controller.signal.aborted) setLoading(false)
        }
    }, [url])

    useEffect(()=>{
        reFetch()
        return () => activeRequest.current?.abort()
    }, [reFetch])

    return {data, loading, error, reFetch} 
}

export default useFetch;
