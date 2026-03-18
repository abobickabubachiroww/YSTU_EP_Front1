import { useEffect, useState } from 'react'

export function useCalendarPlans(educationalPlanId: number) {
	const [plans, setPlans] = useState<any[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const load = async () => {
		if (!educationalPlanId) {
			console.log('useCalendarPlans: educationalPlanId is not set')
			return
		}

		console.log(
			'useCalendarPlans: loading plans for educationalPlanId:',
			educationalPlanId
		)
		setLoading(true)
		setError(null)
		try {
			const res = await fetch(`http://localhost:8001/calendar-plans`)
			if (!res.ok) {
				throw new Error(`HTTP ${res.status}: ${res.statusText}`)
			}
			const data = await res.json()
			console.log('useCalendarPlans: received data:', data)

			// фильтруем по educational_plan_id
			const filtered = Array.isArray(data)
				? data.filter(p => p.educational_plan_id === educationalPlanId)
				: []

			console.log('useCalendarPlans: filtered plans:', filtered)
			setPlans(filtered)
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : String(error)
			console.error('Failed to load calendar plans:', errorMsg)
			setError(errorMsg)
		} finally {
			setLoading(false)
		}
	}

	const createPlan = async (data: any) => {
		try {
			console.log('useCalendarPlans: creating plan with data:', {
				educationalPlanId,
				data,
			})

			const res = await fetch(`http://localhost:8001/calendar-plans`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					educational_plan_id: educationalPlanId,
					data,
				}),
			})

			if (!res.ok) {
				throw new Error(`HTTP ${res.status}: ${res.statusText}`)
			}

			const created = await res.json()
			console.log('useCalendarPlans: plan created successfully:', created)

			// Перезагружаем список планов
			await load()
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : String(error)
			console.error('Failed to create calendar plan:', errorMsg)
			setError(errorMsg)
		}
	}

	const updatePlan = async (id: number, data: any) => {
		try {
			console.log('useCalendarPlans: updating plan', id, 'with data:', data)

			const res = await fetch(`http://localhost:8001/calendar-plans/${id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ data }),
			})

			if (!res.ok) {
				throw new Error(`HTTP ${res.status}: ${res.statusText}`)
			}

			console.log('useCalendarPlans: plan updated successfully')
			await load()
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : String(error)
			console.error('Failed to update calendar plan:', errorMsg)
			setError(errorMsg)
		}
	}

	const deletePlan = async (id: number) => {
		try {
			console.log('useCalendarPlans: deleting plan', id)

			const res = await fetch(`http://localhost:8001/calendar-plans/${id}`, {
				method: 'DELETE',
			})

			if (!res.ok) {
				throw new Error(`HTTP ${res.status}: ${res.statusText}`)
			}

			console.log('useCalendarPlans: plan deleted successfully')
			await load()
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : String(error)
			console.error('Failed to delete calendar plan:', errorMsg)
			setError(errorMsg)
		}
	}

	useEffect(() => {
		load()
	}, [educationalPlanId])

	return { plans, loading, error, createPlan, updatePlan, deletePlan }
}
