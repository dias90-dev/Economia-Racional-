import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

export interface AppTransaction {
  id: string;
  userId: string;
  desc: string;
  type: 'income' | 'expense';
  amount: number;
  date: string;
  cat: string;
  createdAt: any;
}

export interface Activity {
  id: string;
  userId: string;
  action: string;
  sub: string;
  time: string;
  type: 'system' | 'alert' | 'income' | 'success';
  createdAt: any;
}

export interface Goal {
  id: string;
  monthlySavingsGoal: number;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
}

export function useFinanceData() {
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<AppTransaction[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
      if (!u) {
        setTransactions([]);
        setActivities([]);
        setGoal(null);
        setBudgets([]);
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setIsSyncing(true);

    const qT = query(collection(db, 'transactions'), where('userId', '==', user.uid));
    const unsubT = onSnapshot(qT, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as AppTransaction));
      data.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : Date.now();
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : Date.now();
        return timeB - timeA;
      });
      setTransactions(data);
      setLastSync(new Date());
      setIsSyncing(false);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'transactions'));

    const qA = query(collection(db, 'activities'), where('userId', '==', user.uid));
    const unsubA = onSnapshot(qA, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Activity));
      data.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : Date.now();
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : Date.now();
        return timeB - timeA;
      });
      setActivities(data);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'activities'));

    const qG = query(collection(db, 'goals'), where('userId', '==', user.uid));
    const unsubG = onSnapshot(qG, (snap) => {
      if (!snap.empty) {
        const docData = snap.docs[0];
        setGoal({ id: docData.id, monthlySavingsGoal: docData.data().monthlySavingsGoal });
      } else {
        setGoal(null);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'goals'));

    const qB = query(collection(db, 'budgets'), where('userId', '==', user.uid));
    const unsubB = onSnapshot(qB, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, category: d.data().category, limit: d.data().limit } as Budget));
      setBudgets(data);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'budgets'));

    return () => {
      unsubT();
      unsubA();
      unsubG();
      unsubB();
    };
  }, [user]);

  const addTransaction = async (data: Omit<AppTransaction, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) return;
    setIsSyncing(true);
    try {
      await addDoc(collection(db, 'transactions'), {
        ...data,
        userId: user.uid,
        createdAt: serverTimestamp()
      });
      
      await addDoc(collection(db, 'activities'), {
        userId: user.uid,
        action: data.type === 'income' ? 'Nova Receita' : 'Nova Despesa',
        sub: `${data.desc} - R$ ${data.amount}`,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        type: data.type === 'income' ? 'income' : 'alert',
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'transactions');
    } finally {
      setIsSyncing(false);
    }
  };

  const updateGoal = async (monthlySavingsGoal: number) => {
    if (!user) return;
    setIsSyncing(true);
    try {
      if (goal) {
        await updateDoc(doc(db, 'goals', goal.id), {
          monthlySavingsGoal,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'goals'), {
          userId: user.uid,
          monthlySavingsGoal,
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'goals');
    } finally {
      setIsSyncing(false);
    }
  };

  const updateBudget = async (id: string | null, category: string, limit: number) => {
    if (!user) return;
    setIsSyncing(true);
    try {
      if (id) {
        if (limit === 0) {
          await deleteDoc(doc(db, 'budgets', id));
        } else {
          await updateDoc(doc(db, 'budgets', id), { category, limit, updatedAt: serverTimestamp() });
        }
      } else {
        if (limit > 0) {
          await addDoc(collection(db, 'budgets'), { userId: user.uid, category, limit, updatedAt: serverTimestamp() });
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'budgets');
    } finally {
      setIsSyncing(false);
    }
  }

  return { user, transactions, activities, goal, budgets, loading, isSyncing, lastSync, addTransaction, updateGoal, updateBudget };
}
