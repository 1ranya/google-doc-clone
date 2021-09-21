import {useCallback, useEffect, useState} from 'react'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'
import './styles.css'
import io from 'socket.io-client'
import { useParams } from 'react-router-dom'

export default function TextEditor() {
    const [socket, setSocket] = useState()
    const [quill, setQuill] = useState()
    const {id: documentId} = useParams() // id is the same used in the router /documents/:id

    const SAVE_DOC_MS = 2000
    const TOOLBAR_OPTIONS = [
        // [{header: [1,2,3,4,5,6,false]}], 
        ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
        ['blockquote', 'code-block'],

        [{ 'header': 1 }, { 'header': 2 }],               // custom button values
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript
        [{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
        [{ 'direction': 'rtl' }],                         // text direction

        [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],

        [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
        [{ 'font': [] }],
        [{ 'align': [] }],
    ]

    // Connect to server socket 
    useEffect(() => {
        const s = io("http://localhost:3001")
        setSocket(s)
        return () => {
            s.disconnect() 
        }
    }, [])

    // Send quill changes to the server
    useEffect(() => {
        if (socket == null | quill == null) return 

        const handler = ('text-change', (delta, oldDelta, source) =>{
            if (source !== 'user') return
            socket.emit('send-changes', delta)
        })

        quill.on('text-change', handler)

        return () => {
            quill.off('text-change', handler)
        }
    }, [socket, quill])

    // Receive changes from the server
    useEffect(() => {
        if (socket == null | quill == null ) return 

        const handler = (delta) => {
            quill.updateContents(delta)
        }

        socket.on('receive-changes', handler)
        
        return () => {
            socket.off('receive-changes', handler)
        }

    }, [socket, quill]) // [socket, quill] means that, every time quill or socket changes, useEffect should rerender
                        // if [] empty means it should render only once  

    // Receive changes from a specifique document id 
    useEffect(() => {
        if (socket == null | quill == null) return 

        socket.once('load-document', document => {
            quill.setContents(document)
            quill.enable()
        })
        socket.emit('get-document', documentId) // Send to the server the doc id, to create a romm for it 
    }, [socket, quill, documentId])

    const wrapperRef = useCallback(wrapper => {
        if (wrapper == null) return; 
        wrapper.innerHTML = '';

        const editor = document.createElement('div')
        wrapper.append(editor);

        const q = new Quill(editor, {theme: "snow", modules: {toolbar: TOOLBAR_OPTIONS}})
        q.disable()
        q.setText('Loading ...')
        setQuill(q);
    }, [])

    useEffect(() => {
        if (socket == null | quill == null) return 
        setInterval(() => {
            socket.emit('save-document', quill.getContents())
        }, SAVE_DOC_MS)
    }, [socket, quill] )

    return (
        <div className="container" ref={wrapperRef}>
            
        </div>
    )
}
