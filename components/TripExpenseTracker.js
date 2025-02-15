'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChevronDown, ChevronUp, Trash2, Plus } from 'lucide-react';

const TripExpenseTracker = () => {
  const INITIAL_BUDGET = 6789;
  const [budget, setBudget] = useState(INITIAL_BUDGET);
  const [expenses, setExpenses] = useState([]);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startY, setStartY] = useState(null);
  const [swipingItemId, setSwipingItemId] = useState(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  
  const pullThreshold = 100; // pixels to trigger refresh
  const deleteThreshold = 100; // pixels to trigger delete
  
  const [newExpense, setNewExpense] = useState({
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const contentRef = useRef(null);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await fetch('/api/expenses');
      if (!response.ok) throw new Error('Failed to fetch expenses');
      const data = await response.json();
      
      const sortedExpenses = data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setExpenses(sortedExpenses);
      
      const totalExpenses = sortedExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      setBudget(INITIAL_BUDGET - totalExpenses);
      setIsLoading(false);
      setIsRefreshing(false);
    } catch (err) {
      setError('Failed to load expenses');
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleTouchStart = (e) => {
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e) => {
    if (startY !== null) {
      const currentY = e.touches[0].clientY;
      const diff = currentY - startY;
      
      if (diff > 0 && window.scrollY === 0) {
        setIsRefreshing(true);
        e.preventDefault();
        
        // Calculate pull distance as percentage of threshold
        const pullPercentage = Math.min((diff / pullThreshold) * 100, 100);
        contentRef.current.style.transform = `translateY(${diff * 0.3}px)`;
      }
    }
  };

  const handleTouchEnd = () => {
    if (startY !== null && isRefreshing) {
      contentRef.current.style.transform = 'translateY(0)';
      fetchExpenses();
    }
    setStartY(null);
  };

  const handleSwipeStart = (e, expenseId) => {
    setSwipingItemId(expenseId);
    setSwipeOffset(0);
    setStartY(e.touches[0].clientX);
  };

  const handleSwipeMove = (e) => {
    if (swipingItemId !== null && startY !== null) {
      const currentX = e.touches[0].clientX;
      const diff = currentX - startY;
      
      if (diff < 0) { // Only allow left swipe
        setSwipeOffset(diff);
      }
    }
  };

  const handleSwipeEnd = async () => {
    if (swipingItemId !== null) {
      if (Math.abs(swipeOffset) > deleteThreshold) {
        await handleDelete(swipingItemId);
      }
      setSwipeOffset(0);
      setSwipingItemId(null);
      setStartY(null);
    }
  };

  const getBudgetColor = (amount) => {
    if (amount > 1000) return 'bg-green-100';
    if (amount >= 300) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newExpense.amount || !newExpense.description) return;

    const expenseAmount = parseFloat(newExpense.amount);
    
    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newExpense,
          amount: expenseAmount,
        }),
      });

      if (!response.ok) throw new Error('Failed to add expense');

      const savedExpense = await response.json();
      const updatedExpenses = [savedExpense, ...expenses];
      setExpenses(updatedExpenses);
      setBudget(prev => prev - expenseAmount);
      
      setNewExpense({
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      
      setAlertMessage('Go have fun! Your expense has been added successfully.');
      setShowAlert(true);
      setIsFormVisible(false);
      setTimeout(() => setShowAlert(false), 3000);
    } catch (err) {
      setError('Failed to add expense');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDelete = async (expenseId) => {
    try {
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete expense');

      const expenseToDelete = expenses.find(e => e.id === expenseId);
      const updatedExpenses = expenses.filter(e => e.id !== expenseId);
      
      setExpenses(updatedExpenses);
      setBudget(prev => prev + expenseToDelete.amount);
      
      setAlertMessage('Expense deleted successfully');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    } catch (err) {
      setError('Failed to delete expense');
      setTimeout(() => setError(null), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <h1 className="text-lg font-bold">Trip Budget</h1>
            <div className={`px-4 py-2 rounded-lg ${getBudgetColor(budget)}`}>
              <span className="text-xl font-bold">${budget.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div 
        ref={contentRef}
        className="pt-16 transition-transform"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Refresh Indicator */}
          {isRefreshing && (
            <div className="fixed top-16 left-0 right-0 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          )}

          {/* Add Expense Button */}
          <button
            onClick={() => setIsFormVisible(!isFormVisible)}
            className="w-full mb-6 bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2"
          >
            {isFormVisible ? <ChevronUp size={20} /> : <Plus size={20} />}
            {isFormVisible ? 'Hide Form' : 'Add New Expense'}
          </button>

          {/* Collapsible Form */}
          {isFormVisible && (
            <form onSubmit={handleSubmit} className="mb-6 p-4 bg-white rounded-lg shadow">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Amount ($)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0.01"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full p-3 border rounded text-base"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <input
                    type="text"
                    value={newExpense.description}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full p-3 border rounded text-base"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input
                    type="date"
                    value={newExpense.date}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full p-3 border rounded text-base"
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-blue-500 text-white py-3 px-6 rounded hover:bg-blue-600 text-base font-medium"
                >
                  Add Expense
                </button>
              </div>
            </form>
          )}

          {/* Alerts */}
          {showAlert && (
            <Alert className="mb-4">
              <AlertDescription>{alertMessage}</AlertDescription>
            </Alert>
          )}
          
          {error && (
            <Alert className="mb-4 bg-red-100">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Expenses List */}
          <div className="bg-white rounded-lg shadow">
            <h2 className="text-lg font-semibold p-4 border-b">Expenses</h2>
            <div className="divide-y">
              {expenses.map(expense => (
                <div 
                  key={expense.id}
                  className="relative overflow-hidden"
                  onTouchStart={(e) => handleSwipeStart(e, expense.id)}
                  onTouchMove={handleSwipeMove}
                  onTouchEnd={handleSwipeEnd}
                >
                  <div 
                    className="p-4 bg-white transition-transform"
                    style={{
                      transform: expense.id === swipingItemId ? 
                        `translateX(${swipeOffset}px)` : 'translateX(0)'
                    }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex-grow">
                        <p className="font-medium text-base">{expense.description}</p>
                        <p className="text-sm text-gray-500">{expense.date}</p>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <span className="font-semibold text-red-500 text-base">
                          -${expense.amount.toFixed(2)}
                        </span>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="text-gray-500 hover:text-red-500 p-2"
                          aria-label="Delete expense"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                  {/* Delete indicator background */}
                  <div 
                    className="absolute inset-y-0 right-0 bg-red-500 flex items-center justify-end px-4"
                    style={{
                      width: deleteThreshold,
                      opacity: expense.id === swipingItemId ? 
                        Math.min(Math.abs(swipeOffset) / deleteThreshold, 1) : 0
                    }}
                  >
                    <Trash2 className="text-white" size={24} />
                  </div>
                </div>
              ))}
              {expenses.length === 0 && (
                <p className="p-4 text-gray-500 text-center text-base">No expenses yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripExpenseTracker;