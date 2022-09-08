import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useUserAuth } from '../context/UserAuthContext';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, orderBy } from 'firebase/firestore';
import { onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useDrag } from 'react-dnd';
import { useDrop } from 'react-dnd';
import NavBar from './NavBar';
import ModeCommentRoundedIcon from '@mui/icons-material/ModeCommentRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import './project.scss';
import PacmanLoader from 'react-spinners/PacmanLoader';
import _ from 'underscore';

function Project() {
	const [loading, setLoading] = useState(false);
	useEffect(() => {
		setLoading(true);
		setTimeout(() => {
			setLoading(false);
		}, 1900);
	}, []);

	let { id } = useParams();
	const { logOut, user } = useUserAuth();
	const [title, setTitle] = useState('');
	const [comment, setComment] = useState('');
	const [allTasks, setTasks] = useState([]);
	const [chat, setChat] = useState([]);
	const [message, setMessage] = useState([]);
	const tasksRef = collection(db, 'tasks');
	const completeTasksRef = collection(db, 'completeTasks');
	const chatRef = collection(db, 'chat');
	const [projectDetails, setProjectDetails] = useState([]);
	const [completeTasks, setCompleteTasks] = useState([]);
	const [modal, setModal] = useState(false);
	const inProcessRef = collection(db, 'inProcess');
	const [inProcess, setInProcess] = useState(['ehde']);

	useEffect(
		() =>
			onSnapshot(collection(db, 'tasks'), (snapshot) => {
				const tasks = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
				setTasks(tasks);
				window.TASKS = tasks;
			}),
		[]
	);

	useEffect(() => onSnapshot(collection(db, 'projects'), (snapshot) => setProjectDetails(snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id })))), []);
	useEffect(() => onSnapshot(collection(db, 'completeTasks'), (snapshot) => setCompleteTasks(snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id })))), []);
	useEffect(() => onSnapshot(collection(db, 'inProcess'), (snapshot) => setInProcess(snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id })))), []);
	useEffect(() => onSnapshot(collection(db, 'chat'), (snapshot) => setChat(snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id })))), []);

	const handleDelete = async (id) => {
		console.log(id);
		const projectsRef = doc(db, 'tasks', id);
		try {
			await deleteDoc(projectsRef);
		} catch (err) {
			alert(err);
		}
	};
	const handleDeleteFromProcess = async (id) => {
		console.log(id);
		const inProcessRef = doc(db, 'inProcess', id);
		try {
			await deleteDoc(inProcessRef);
		} catch (err) {
			alert(err);
		}
	};
	const handleDeleteFromCompleted = async (id) => {
		console.log(id);
		const inProcessRef = doc(db, 'completeTasks', id);
		try {
			await deleteDoc(inProcessRef);
		} catch (err) {
			alert(err);
		}
	};
	const [{ isOver }, drop] = useDrop(() => ({
		accept: 'task',
		drop: (item) => addTaskToDone(item.id, item.title, item.comment),
		collect: (monitor) => ({
			isOver: !!monitor.isOver(),
		}),
	}));

	const [{ isOver1 }, drop1] = useDrop(() => ({
		accept: 'task',
		drop: (item) => addTaskToInProcess(item.id, item.title, item.comment),
		collect: (monitor) => {
			return { isOver: !!monitor.isOver() };
		},
	}));
	const [{ isOver2 }, drop2] = useDrop(() => ({
		accept: 'task',
		drop: (item) => addTaskToToDo(item.id, item.title, item.comment),

		collect: (monitor) => ({
			isOver: !!monitor.isOver(),
		}),
	}));

	const addTaskToDone = async (taskId, title, comment) => {
		console.log('done');
		await handleDeleteFromProcess(taskId);
		await handleDeleteFromCompleted(taskId);
		await handleDelete(taskId);
		await addDoc(completeTasksRef, { projectId: id, title: title, comment: comment, status: false, userEmail: user.email, time: new Date().getTime() });
	};
	const addTaskToInProcess = async (taskId, title, comment) => {
		console.log('process');
		await handleDeleteFromCompleted(taskId);
		await handleDeleteFromProcess(taskId);
		await handleDelete(taskId);
		await addDoc(inProcessRef, { projectId: id, title: title, comment: comment, status: false, userEmail: user.email, time: new Date().getTime() });
	};
	const addTaskToToDo = async (taskId, title, comment) => {
		console.log('todo');
		await handleDeleteFromCompleted(taskId);
		await handleDeleteFromProcess(taskId);
		await handleDelete(taskId);

		await addDoc(tasksRef, { projectId: id, title: title, comment: comment, status: false, userEmail: user.email, time: new Date().getTime() });
	};

	const addTask = async (e) => {
		e.preventDefault();
		await addDoc(tasksRef, { projectId: id, title: title, comment: comment, status: false, userEmail: user.email, time: new Date().getTime() });
		setTitle('');
		setComment('');
	};

	const addChat = async (e) => {
		e.preventDefault();
		await addDoc(chatRef, { projectId: id, message: message, userEmail: user.email, time: new Date().getTime() });
		setMessage('');
	};

	return (
		<div className="projectBody">
			{loading ? (
				<div className="pacman">
					<PacmanLoader size="50" color="#6236d6" />
				</div>
			) : (
				<div>
					{projectDetails.map((project) => (project.id === id ? <NavBar mainTitle={project.title} /> : ''))}

					<div className="newProject">
						<div className="addTask">
							<h2 className="h3">Tasks</h2>
							<div className="taskList" ref={drop2}>
								{allTasks
									.sort((objA, objB) => Number(objA.time) - Number(objB.time))
									.map((task) => {
										if (id === task.projectId) {
											return (
												<div className="listTask">
													<Task task={task} />
												</div>
											);
										}
									})}
							</div>
							<div className="taskForm">
								<h3>Add a new Task </h3>
								<input required value={title} type="text" onChange={(e) => setTitle(e.target.value)} placeholder="task title" />
								<textarea value={comment} type="text" onChange={(e) => setComment(e.target.value)} placeholder="comment" />
								<button onClick={addTask}>Add</button>
							</div>
						</div>
						<div className="progress">
							<h2>In Progress</h2>
							<div className="donely taskList" ref={drop1}>
								{inProcess
									.sort((objA, objB) => Number(objA.time) - Number(objB.time))
									.map((task) =>
										id === task.projectId ? (
											<div className="listTask task">
												<Process task={task} />
											</div>
										) : (
											''
										)
									)}
							</div>
						</div>
						<div className="done">
							<h2>Completed</h2>
							<div className="donely" ref={drop}>
								{completeTasks
									.sort((objA, objB) => Number(objA.time) - Number(objB.time))
									.map((task) =>
										id === task.projectId ? (
											<div className="task">
												<Complete task={task} />
											</div>
										) : (
											''
										)
									)}
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

const Task = ({ task }) => {
	const handleDelete = async (id) => {
		const projectsRef = doc(db, 'tasks', id);
		try {
			await deleteDoc(projectsRef);
		} catch (err) {
			alert(err);
		}
	};
	const [{ isDragging }, drag] = useDrag(() => ({
		type: 'task',
		item: { id: task.id, title: task.title, comment: task.comment },
		collect: (monitor) => {
			return {
				isDragging: !!monitor.isDragging(),
			};
		},
	}));

	return (
		<div key={task.id} ref={drag} id={task.id}>
			<h3>{task.title}</h3>
			<p>{task.comment}</p>
			<div
				className="close"
				onClick={() => {
					handleDelete(task.id);
				}}
			></div>
		</div>
	);
};
const Process = ({ task }) => {
	const handleDelete = async (id) => {
		const inProcessRef = doc(db, 'inProcess', id);
		try {
			await deleteDoc(inProcessRef);
		} catch (err) {
			alert(err);
		}
	};
	const [{ isDragging }, drag] = useDrag(() => ({
		type: 'task',
		item: { id: task.id, title: task.title, comment: task.comment },
		collect: (monitor) => ({
			isDragging: !!monitor.isDragging(),
		}),
	}));

	return (
		<div key={task.id} ref={drag} id={task.id}>
			<h3>{task.title}</h3>
			<p>{task.comment}</p>
			<div
				className="close"
				onClick={() => {
					handleDelete(task.id);
				}}
			></div>
		</div>
	);
};
const Complete = ({ task }) => {
	const handleDelete = async (id) => {
		const inProcessRef = doc(db, 'inProcess', id);
		try {
			await deleteDoc(inProcessRef);
		} catch (err) {
			alert(err);
		}
	};
	const [{ isDragging }, drag] = useDrag(() => ({
		type: 'task',
		item: { id: task.id, title: task.title, comment: task.comment },
		collect: (monitor) => ({
			isDragging: !!monitor.isDragging(),
		}),
	}));

	return (
		<div key={task.id} ref={drag} id={task.id}>
			<h3>{task.title}</h3>
			<p>{task.comment}</p>
			<div
				className="close"
				onClick={() => {
					handleDelete(task.id);
				}}
			></div>
		</div>
	);
};

export default Project;
